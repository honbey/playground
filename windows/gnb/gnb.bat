@Echo off
::set YYYYmmdd=%date:~0,4%%date:~5,2%%date:~8,2%
::set "GNB_LOG=gnb-%YYYYmmdd%.log"
::set "ERROR_LOG=error-%YYYYmmdd%.log"
set GNB_EXE_PATH="C:\Users\zhang\Documents\tools\gnb"

::TaskList | Find "gnb.exe"
TaskList | FindStr "gnb.exe"
If %errorlevel%==1 (
  cd %GNB_EXE_PATH%
  start /b .\bin\Window10_x86_64\gnb.exe -c conf\1002 -4
) Else (
  Echo gnb.exe is exist.
)
