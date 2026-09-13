import sys, unittest, json, tempfile
from pathlib import Path
from datetime import date, timedelta
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import update_calendar as u

def fixture(y=2024):
    rows=['西元日期,星期,是否放假,備註']; d=date(y,1,1)
    while d.year==y:
        rows.append(f'{d:%Y%m%d},{"一二三四五六日"[d.weekday()]},{2 if d.weekday()>4 else 0},'); d+=timedelta(days=1)
    return '\n'.join(rows)
class Validation(unittest.TestCase):
    def test_encodings(self):
        for enc in ['UTF-8','BIG5']:
            self.assertEqual(len(u.parse_csv(fixture().encode('utf-8-sig' if enc=='UTF-8' else 'cp950'),2024,enc)),366)
    def test_invalid(self):
        s=fixture()
        for bad in [s.rsplit('\n',1)[0],s+'\n'+s.splitlines()[1],s.replace('20240101,一,0','20240101,一,1'),s.replace('20240101,一','20240101,二'),'<html>error</html>']:
            with self.assertRaises((ValueError,UnicodeError)):u.parse_csv(bad.encode(),2024)
    def test_revision_selection(self):
        def r(t,url):return {'resourceDescription':t,'resourceFormat':'CSV','resourceDownloadUrl':url}
        items=[r('114年辦公日曆','https://www.dgpa.gov.tw/files/202407/a'),r('114年辦公日曆(1141020更新)','https://www.dgpa.gov.tw/files/202510/b'),r('114年Google修正版','https://www.dgpa.gov.tw/files/202611/c'),r('116年辦公日曆','https://www.dgpa.gov.tw/files/202607/d')]
        self.assertTrue(u.select_resources(items)[2025]['resourceDescription'].endswith('更新)'))
        self.assertIn(2027,u.select_resources(items))
        with self.assertRaises(ValueError):u.select_resources([items[0],r('114年辦公日曆','https://www.dgpa.gov.tw/files/202407/z')])
    def test_failure_does_not_replace(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'site/data').mkdir(parents=True);p=root/'site/data/calendar.json';p.write_text('{"days":{},"years":[]}')
            resources=[{'resourceDescription':'113年辦公日曆','resourceFormat':'CSV','resourceDownloadUrl':'https://www.dgpa.gov.tw/test.csv'}]
            with patch.object(u,'ROOT',root),patch.object(u,'get',side_effect=[json.dumps({'success':True,'result':{'distribution':resources}}).encode(),b'bad']):
                with self.assertRaises(ValueError):u.update()
            self.assertEqual(p.read_text(),'{"days":{},"years":[]}')
    def test_success_and_unchanged_check(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'site/data').mkdir(parents=True)
            m=json.dumps({'success':True,'result':{'distribution':[{'resourceDescription':'113年辦公日曆','resourceFormat':'CSV','resourceDownloadUrl':'https://www.dgpa.gov.tw/test.csv'}]}}).encode()
            with patch.object(u,'ROOT',root),patch.object(u,'get',side_effect=[m,fixture().encode(),m,fixture().encode()]):
                u.update();one=json.loads((root/'site/data/calendar.json').read_text());u.update();two=json.loads((root/'site/data/calendar.json').read_text())
            self.assertEqual(one['updatedAt'],two['updatedAt']);self.assertNotEqual(one['checkedAt'],two['checkedAt']);self.assertEqual(len(two['days']),366)
if __name__=='__main__':unittest.main()
