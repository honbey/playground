" Mindcode syntax file
" Language:     mindcode
" Maintainer:   Honbey
" Last Change:  2024-06-02
" Remark:       Mindcode to Mindustry Logic
" Reference:....
"   https://vimcdoc.sourceforge.net/doc/usr_44.html#44.3
"   https://vimdoc.sourceforge.net/
"   https://github.com/fatih/vim-go/blob/master/syntax/go.vim
"   https://github.com/vim-python/python-syntax/blob/master/syntax/python.vim
"   https://thoughtbot.com/blog/writing-vim-syntax-plugins
"   https://github.com/cardillan/mindcode/tree/main/doc/syntax

clear

if exists("b:current_syntax")
  finish
endif

syn case match

syn match mndComment /\/\/.*/ contains=mndTodo
syn region mndComment start=/\/\// end=/$/ contained

syn keyword mndTodo TODO FIXME XXX BUG contained
syn region mndPreproc start=/#/ end=/$/ contains=mndComment keepend

hi def link mndComment Comment
hi def link mndPreProc PreProc

syn keyword mndType const
syn keyword mndMemory heap stack


syn keyword mndConditional if else elsif case
syn keyword mndRepeat while do loop for
syn keyword mndLabel when then break continue
syn keyword mndOtherLabel allocate inline def
syn match mndKeyword /\<end\>/ keepend

hi def link mndType Type
hi def link mndMemory Structure
hi def link mndConditional Conditional
hi def link mndRepeat Repeat
hi def link mndLabel Label
hi def link mndOtherLabel Label
hi def link mndKeyword Keyword
hi def link mndStatement Statement

syn cluster mndExpression contains=@mndExpValue,mndOperator
syn cluster mndExpValue contains=mndNull,mndNumber,mndFloat,mndBoolean,mndVariable
syn cluster mndExpValue add=mndGlobalVar,mndInnerVar,mndExterVar,mndTernaryOp
syn cluster mndExpValue add=mndFunction

syn keyword mndBooleanOp and or not in
syn match mndBooleanOp /[!<>]=\=\|[!=]==/
syn match mndBooleanOp /!\|\([&|=]\)\1/
syn match mndBinaryOp /<<\|>>\|[&|^]/
syn match mndArithmeticOp /[-+\\%]\|\*\=\*/
syn match mndArithmeticOp /\/\%(=\|\ze[^/*]\)/
syn match mndVarAssign /=/ skipwhite nextgroup=@mndExpValue
syn match mndVarAssign /[-+\\%&|^]=/ skipwhite nextgroup=@mndExpValue
syn match mndVarAssign /\([*<>&|]\)\1\==/ skipwhite nextgroup=@mndExpValue
" TODO: improve accuracy
syn match mndTernaryOp /?\(\_s\S\)\@=/

hi def link mndBooleanOp mndOperator
hi def link mndBinaryOp mndOperator
hi def link mndArithmeticOp mndOperator
hi def link mndVarAssign mndOperator
hi def link mndTernaryOp mndOperator

hi def link mndOperator Operator

" syn region mndParen start=/(/ end=/)/ transparent
" syn region mndBlock start=/def\|if\|while\|for/ end=/\<end\>/ contains=mndBlock

" It's unnecessary to syntax common varibles
"syn match mndVariable /[^.$@]\<\zs\h\w*\ze\>/ contained
syn match mndGlobalVar /\<\u\%(\u\|[_0-9]\)*\>/
syn match mndInnerVar1 /\zs@\l[-a-z]*\ze\>/
syn match mndInnerVar2 /\<\l\+\d\+\>/
syn match mndExterVar /$\h\w*\>/

"hi def link mndVariable Ignore
hi def link mndGlobalVar Identifier
hi def link mndInnerVar1 Tag
hi def link mndInnerVar2 Delimiter
hi def link mndExterVar Define

"syn keyword mndFunctionKey def skipwhite nextgroup=mndFuncName
syntax match mndFuncName /\<\zs\h\w*\ze\s*(/ skipwhite nextgroup=mndFuncParams
syntax match mndFuncParams /\<\h\w*(\zs[^()]*\ze)/ contained contains=mndExpression

" provide a compromise to check name of inner functions
syntax match mndLibFunc /print[fl][n]\=\ze\s*(/
syntax match mndLogicFunc /\v<(clear|col(or)=|stroke|line|rect|rectline|poly|linePoly|triangle|image)\ze\s*\(/
syntax match mndLogicFunc /\v<(print|draw)flush\ze\s*\(/
syntax match mndLogicFunc /\v<(getlink|enabled|shootp=|config(ure)=)\ze\s*\(/
syntax match mndLogicFunc /\v<(radar|sensor|lookup|pickcolor|wait|stopProcessor)\ze\s*\(/
syntax match mndLogicFunc /\v<(max|min|angle|len|noise|abs|log(10)=|floor|ceil|sqrt|rand)\ze\s*\(/
syntax match mndLogicFunc /\v<(a=sin|a=cos|a=tan|)\ze\s*\(/
syntax match mndLogicFunc /\v<(ubind|idle|stop|move|approach|(auto)=[P|p]athfind|boost|targetp=)\ze\s*\(/
syntax match mndLogicFunc /\v<((item|pay)(Drop|Take)|payEnter|mine|flag|build|within|getBlock|unbind)\ze\s*\(/
syntax match mndLogicFunc /\v<(uradar|ulocate)\ze\s*\(/
" XXX not provide functions of world processor
" TODO: add Property Name

hi def link mndLibFunc mndFunction
hi def link mndLogicFunc mndFunction
hi def link mndFuncName mndFunction
hi def link mndFuncParams mndFunction

hi def link mndFunction Function

syn keyword mndNull null
syn match mndNumber /\v<\d+>/ display
syn match mndNumber /\v<0x\x+([Pp]-?)?\x+>/ display
syn match mndFloat /\v<\d+\.\d+>/ display
syn match mndFloat /\v<\d*\.?\d+([Ee]-?)?\d+>/ display
syn match mndBoolean /\vtrue|false/

hi def link mndNull Constant
hi def link mndNumber Number
hi def link mndFloat Float
hi def link mndBoolean Boolean

syn region mndString start=/"/ skip=/\\"/ end=/"/
syn region mndString start=/'/ skip=/\\'/ end=/'/
syn match mndStrFormat /$\w\+\ze\(\s|['"\\]\)/ contained
syn match mndStrFormat /$\%({}\)\=/ contained
syn region mndStrFormat start=/${/ end=/}/ contained contains=@mndExpValue
syn region mndPrintfStr start=/\%(printf\s*(\s*\)\@<=\z(["']\)/ skip=/\\"\|\\'/ end=/\z1/ contains=mndStrFormat
syn match mndInnerIcon /\<\(BLOCK\|ITEM\|LIQUID\|STATUS\|TEAM\|UNIT\)-\%(\u\|-\)\+\>/
syn match mndInnerIcon /ALPHAAAA\|CRATER/

hi def link mndString String
hi def link mndPrintfStr String
hi def link mndInnerIcon Character

syn region mndList start=/\[/ end=/\]/ contains=ALLBUT,mndString

syn region mndLogicControl start=/end(/ end=/)/

hi def link mndLogicControl Underlined

syn sync minlines=10

let b:current_syntax = 'mnd'

" my custom syntax highlight, base on Neovim and theme Catppuccin Frappé
if exists("g:honbey_syn_hl")
	hi mndGlobalVar cterm=italic gui=italic guifg=#FA8072
	hi mndInnerVar1 guifg=#EE82EE
	hi mndInnerVar2 guifg=#FFE4E1
	hi mndLibFunc guifg=#00BFFF
	hi mndLogicFunc guifg=#1E90FF
	hi mndLogicControl cterm=italic gui=italic guibg=#FF6347 guifg=#C0C0C0
endif
