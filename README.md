# 臺灣日期計算器｜GitHub 上架操作手冊

版本：2026-09-13。建議先開啟 GUIDE.html，以瀏覽器閱讀本手冊。

## 先知道目前完成到哪裡

網頁、日期運算、官方資料更新程式、GitHub Actions 發布流程已製作完成。本機通過7項日期運算測試與5項更新程式測試；製作環境沒有可用瀏覽器，尚未完成實際畫面驗證。這份下載包尚未包含正式日曆資料：製作環境無法下載官方 CSV，因此必須上傳 GitHub 後執行首次更新，才可計算工作日與假日調整。正式 CSV 下載與 GitHub 雲端部署尚待你帳戶首次執行驗證。日曆日計算現在即可使用；不會把測試資料當作臺灣日曆。

支援日期間隔、日期前後推算、日曆日／工作日、起算當天是否計入、結束當天是否計入、結果順延或提前、逐日明細、特殊休假設定及其備份。工作日以政府行政機關辦公日曆為準；並非自動辨識各公司班表或個別業務期限規則。

## 1. 下載並解壓縮

下載 taiwan-date-calculator.zip，按右鍵→「解壓縮全部」。打開解壓後的 taiwan-date-calculator 資料夾。

其中應有 site、scripts、tests、.github 資料夾，以及 README.md、GUIDE.html、workflow-copy.txt。上傳的是裡面的內容，不是外層整個資料夾，也不是 ZIP 檔本身。

先試畫面：開啟 site 資料夾，雙擊 index.html。此時可算日曆日；工作日會顯示需要官方資料。

## 2. 登入 GitHub 並建立新儲存庫

1. 開啟 https://github.com 並登入；沒有帳號就先註冊。
2. 按右上角「＋」→ New repository。
3. Repository name 填 taiwan-date-calculator。
4. 選 Public（公開）。這是使用 GitHub Free 的 Pages 路線；網頁及程式碼可公開閱讀。
5. 勾選 Add README，讓儲存庫先有 main 分支。
6. 按 Create repository。

不要在這個公開儲存庫放個人資料、密碼或機密檔案。本專案不需自建 API 金鑰。

## 3. 上傳程式檔案

1. 在儲存庫的 Code 頁，按 Add file → Upload files。
2. 從解壓後的資料夾，拖曳 site、scripts、tests 三個資料夾，以及 README.md、GUIDE.html、workflow-copy.txt 三個檔案到上傳區。README.md 會替換建立儲存庫時的預設說明。
3. 確認上傳路徑是 site/index.html、scripts/update_calendar.py 等，前面沒有多一層 taiwan-date-calculator/。
4. 下方 Commit message 填「加入日期計算器」。選 Commit directly to the main branch，按 Commit changes。
5. 回到 Code 頁，應直接看到 site、scripts、tests 三個資料夾。

這一步先不上傳 .github；第5步另外建立，以免資料夾漏傳或過早執行。

## 4. 啟用 GitHub Pages

1. 按儲存庫上方 Settings。
2. 左側選 Pages。
3. 找 Build and deployment → Source。
4. 選 GitHub Actions。不要選 Deploy from a branch。

若找不到 Pages，確認是你有管理權限的儲存庫；本手冊以個人帳戶、Public 儲存庫為前提。

## 5. 建立自動更新工作流程

1. 回到 Code，按 Add file → Create new file。
2. 在檔名欄貼上完整路徑：.github/workflows/update-and-deploy.yml
3. 在電腦上用記事本開啟 workflow-copy.txt，全選並複製全部內容。
4. 貼到 GitHub 的檔案內容區。保留縮排，不要加 Markdown 的三個反引號。
5. 按 Commit changes，選直接存入 main，再確認提交。

這裡 .github 前面的點不能省略，檔案副檔名是 .yml，不能變成 .yml.txt。workflow-copy.txt 只是方便複製；真正執行的是 .github/workflows/update-and-deploy.yml。

本流程已在 YAML 宣告所需的 contents: write、pages: write、id-token: write 權限，通常無須更改全站權限。若機關或組織政策禁止 Actions 寫入，須由該組織管理者處理。

## 6. 執行第一次更新與發布

1. 按上方 Actions。
2. 若顯示啟用工作流程的提示，先啟用。
3. 點左側「更新日曆並發布網站」。建立 YAML 後通常已自動執行一次。
4. 若尚未執行，或剛調好 Pages 設定：按 Run workflow → 選 main → Run workflow。
5. 點最新一筆執行，查看 build 和 deploy。
6. 等待成功。build 中「取得並檢查官方日曆」必須成功，deploy 也必須成功；不能只看到網站可開啟就當作更新成功。

成功時會取得官方資料集裡自2024年起的完整逐日 CSV，優先使用可辨識的較新修正版，並自動納入日後新年度。每年各日期都要存在一次，放假代碼及星期都須有效。若版本先後無法判定，會停止更新等人工處理。

## 7. 取得你的網址

到 Settings → Pages，開啟顯示的網站網址；或開啟 Actions 的 deploy 工作中顯示的部署連結。

通常形式為：https://你的GitHub帳號.github.io/taiwan-date-calculator/

首次發布可能需要數分鐘。請以 GitHub 顯示的實際連結為準，並加入瀏覽器書籤。你不需另買網域。

## 8. 上線後核對一次

1. 網頁上方應顯示「已載入年度」，不能仍是尚未載入。
2. 展開「日曆來源與特殊休假設定」，確認最後成功檢查時間。
3. 日曆日測試：2024-02-28 至 2024-03-01，不計起日、計入迄日，應為2天。
4. 起日與迄日同一天：兩個端點都勾選為1天；只要任一端未勾選就是0天。
5. 到官方日曆來源選一段你熟悉的連假，以工作日模式計算並展開逐日明細，核對該年度補假與補班。
6. 另測試一個沒有資料的年度；工作日應提示資料不足，不能自行當作週一至週五。

官方資料集：https://data.gov.tw/dataset/14718

## 9. 日後如何自動更新

排程設定為臺灣每天05:23（UTC前一天21:23），由 GitHub 執行，你的電腦不需開機。排程不是即時服務，可能延遲或略過。

每天成功檢查後，程式會把真實檢查時間與日曆寫回儲存庫，再在同一工作流程發布網站；即使假日內容沒變，也會保存新的檢查紀錄。這會留下可追溯的更新紀錄，也讓儲存庫持續有活動。「日曆內容更新時間」則只在內容或來源版本變更時改變。

使用者下次連線開啟或按「重新讀取網站資料」，會抓取網站上已發布的最新日曆。這顆按鈕不會直接啟動 GitHub Actions。若急需現在檢查官方來源，請到 Actions → 更新日曆並發布網站 → Run workflow。

下載到電腦的本機版本不會自己改寫。首次雲端更新成功後，可以在 GitHub Code → Download ZIP 下載含正式資料的新版，再雙擊 site/index.html 離線使用；日後請重新下載更新。

## 10. 更新失敗或排程停用時

官方 CSV 無法取得或檢查失敗：不替換日曆檔案，網站會發布保留的上一版。第一次就失敗時會維持空日曆，工作日計算停用。工作流程最後會標成失敗，以便你從 Actions 看見問題。

超過7天未成功檢查：網頁顯示舊版提醒。這是日期新鮮度提示，不代表既有資料一定錯誤。

公開儲存庫60天無活動，GitHub 可能停用排程。正常成功寫回紀錄時可維持活動；若長期失敗仍可能停用。到 Actions 選該工作流程，若有 Enable workflow 就重新啟用，再按 Run workflow。可在 GitHub 個人 Settings → Notifications 檢查 Actions 通知偏好。

常見問題：

| 現象 | 處理方式 |
| --- | --- |
| Actions 左側沒有工作流程 | 到 Code 確認 .github/workflows/update-and-deploy.yml 存在於 main，內容不是空白。 |
| Pages 發布失敗／找不到 Pages | Settings → Pages → Source 選 GitHub Actions，再手動執行。 |
| git push 出現403或保護規則拒絕 | 檢查 workflow 權限、組織政策及 main 的分支保護；不要把權限問題誤認成日曆問題。可請管理者允許本專案既定寫入流程。 |
| 取得官方日曆出現403、逾時 | 稍後手動重跑；若持續失敗，需檢查官方來源可否從 GitHub 存取。 |
| CSV 欄位／日期／版本驗證失敗 | 不要直接略過檢查。保留失敗訊息，請我協助調整對應官方格式。 |
| 網址404 | 確認 deploy 成功、網址含儲存庫名稱、site/index.html 路徑正確，稍後重新整理。 |
| 網頁仍顯示沒有日曆 | 檢查官方下載步驟，而不是只看 deploy；更新成功後按重新讀取網站資料。 |
| 算出來差1天 | 核對起算日、結束日是否計入；「往後N天」預設不計起算日。 |

## 特殊停班日與備份

在網頁下方新增某日為休假或上班，並填原因。這些設定只存在目前瀏覽器，優先於已載入年度的官方資料。它們不能用來補齊一整個缺少官方資料的年度。清除網站資料、換瀏覽器或換電腦後需匯入備份。

「匯出特殊日期備份」保存 JSON；匯入會合併設定，同日以匯入檔覆蓋。地區性颱風停班不會從年度 CSV 自動取得，請自行依適用公告輸入。正式期限是否適用順延，仍由使用者依業務規則選擇。

## 給維護者

純HTML/CSS/JavaScript，無需 npm 安裝；更新程式使用 Python 標準函式庫。

本機測試：node --test tests/core.test.cjs

更新器測試：python -m unittest discover -s tests -p 'test_*.py'

下載日曆：python scripts/update_calendar.py

資料來源 API：https://data.gov.tw/api/v2/rest/dataset/14718

資料遵循政府資料開放授權條款第1版：https://data.gov.tw/license

參考：GitHub Pages 自訂工作流程 https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

參考：上傳檔案 https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

參考：排程限制 https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
