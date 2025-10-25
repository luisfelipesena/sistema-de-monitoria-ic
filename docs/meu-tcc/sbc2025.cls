\NeedsTeXFormat{LaTeX2e}[1995/12/01] 

\ProvidesClass{sbc2025}[2022/12/14, v3.0]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\LoadClass[twoside,twocolumn,10pt,a4paper]{article}
\setlength{\parindent}{20pt}


%\RequirePackage{academicons} % desnecessario se usarmos o pacote
% orcidlink. Afinal o único glifo usado do academicons é o do orcid!
\RequirePackage{orcidlink}

\RequirePackage{fontawesome} % o glifo de envelope de carta é deste
                             % pacote 

% Identify the engine in use (pdftex, luatex, xetex)
\RequirePackage{iftex}
\ifpdftex % caso o engine seja o pdflatex
	\RequirePackage[T1]{fontenc}
	%\RequirePackage{lmodern}
        \usepackage{tgtermes}
	\RequirePackage[tracking=smallcaps]{microtype}
	\RequirePackage[book]{FiraSans}
     \else % caso o engine seja o xelatex ou lualatex
        \RequirePackage{fontspec}
        \setmainfont{TeX Gyre Termes}%% esse typeface eh versao livre 
	%% e gratuita do {Times New Roman} que as editoras tem mas os 
	%% usuarios nao tem acesso. A familia TeX Gyre esta disponivel 
	%% na distribuicao TEXLIVE que eh usada pelo OverLeaf. Pode ser
	%% que o OverLeaf tenha o Times New Roman na sua configuracao. 
	%% Ha que se investigar isso!
	\setsansfont{Roboto}
\fi

\RequirePackage{xcolor}
\RequirePackage{graphicx}

\RequirePackage{etoolbox}
\RequirePackage{amsmath,amssymb}
\RequirePackage[style]{abstract}
\RequirePackage{enumitem}
\RequirePackage[explicit]{titlesec}
\RequirePackage{caption}
\RequirePackage{fancyhdr}
\RequirePackage{hyperref} 
\RequirePackage[a4paper,top=.4in,includehead,headsep=10pt,headheight=28pt,left=.70in,textwidth=41.5pc,textheight=60pc,columnsep=18pt,footskip=18pt]{geometry}


% LaTeX 3 extensions
\RequirePackage{expl3}
\RequirePackage{xparse}


% String manipulation
\RequirePackage{xstring}
\RequirePackage{trimspaces}

\RequirePackage{caption}
\RequirePackage{babel}
\RequirePackage{iflang}

% Arithmetic expressions in \set{length,counter} & \addto{length,counter};
% commands \widthof, \heightof, \depthof, \totalheightof, \settototalheight
\usepackage{calc}



\ExplSyntaxOn

% We need to have at least some variant of Portuguese and of English
% loaded to generate the abstract/resumo.
%
% babel traditionally uses "portuguese", "brazilian", "portugues", or
% "brazil" to support the Portuguese language, using .ldf files. babel
% is also in the process of implementing a new scheme, using .ini
% files, based on the concept of "locales" instead of "languages". This
% mechanism uses the names "portuguese-portugal", "portuguese-brazil",
% "portuguese-pt", "portuguese-br", "portuguese", "brazilian", "pt",
% "pt-PT", and "pt-BR" (i.e., neither "portugues" nor "brazil"). To avoid
% compatibility problems, let's stick with "brazilian" or "portuguese"
% by substituting portugues and brazil if necessary.

\seq_gclear_new:N \l_tmpa_seq
\seq_gclear_new:N \l_tmpb_seq
\seq_gset_from_clist:NN \l_tmpa_seq \@classoptionslist

% First, make sure any instances of "portugues" and "brazil" are replaced
% by "portuguese" and "brazilian"; other options are unchanged.
\seq_map_inline:Nn \l_tmpa_seq {
  \def\@tempa{#1}
  \ifstrequal{portugues}{#1}
    {
      \ClassWarning{sbc2025}{Substituting~language~portugues~->~portuguese}
      \def\@tempa{portuguese}
    }
    {}
  \ifstrequal{brazil}{#1}
    {
      \ClassWarning{sbc2025}{Substituting~language~brazil~->~brazilian}
      \def\@tempa{brazilian}
    }
    {}
  \seq_gput_right:NV \l_tmpb_seq {\@tempa}
}

% Remove the leftmost duplicates (default is to remove the rightmost ones).
% Necessary in case the user did "portugues,portuguese", "brazil,brazilian"
% or some variation: When we substitute the language, we may end up with the
% exact same language twice, which may mess up the main language selection.
\seq_greverse:N \l_tmpb_seq
\seq_gremove_duplicates:N \l_tmpb_seq
\seq_greverse:N \l_tmpb_seq

% If the user failed to select some variation of English and Portuguese,
% we add them here. We also remember which ones of portuguese/brazilian,
% english/american/british etc. were selected.
\exp_args:Nnx \regex_extract_all:nnNTF
  {\b(ptbr|portuguese|brazilian)\b}
  {\seq_use:Nn \l_tmpb_seq {,}}
  \l_tmpa_tl
  {
    \tl_reverse:N \l_tmpa_tl
    \xdef\@SBCpt{\tl_head:N \l_tmpa_tl}
  }
  {
    \seq_gput_left:Nn \l_tmpb_seq {ptbr}
    \gdef\@SBCpt{ptbr}
  }

\exp_args:Nnx \regex_extract_all:nnNTF
  {\b(spanish)\b}
  {\seq_use:Nn \l_tmpb_seq {,}}
  \l_tmpa_tl
  {
    \tl_reverse:N \l_tmpa_tl
    \xdef\@SBCes{\tl_head:N \l_tmpa_tl}
  }
  {
    \seq_gput_left:Nn \l_tmpb_seq {spanish}
    \gdef\@SBCes{spanish}
  }

\exp_args:Nnx \regex_extract_all:nnNTF
  {\b(english|american|USenglish|canadian|british|UKenglish|australian|newzealand)\b}
  {\seq_use:Nn \l_tmpb_seq {,}}
  \l_tmpa_tl
  {
    \tl_reverse:N \l_tmpa_tl
    \xdef\@SBCen{\tl_head:N \l_tmpa_tl}
  }
  {
    \seq_put_left:Nn \l_tmpb_seq {english}
    \gdef\@SBCen{english}
  }

\xdef\@classoptionslist{\seq_use:Nn \l_tmpb_seq {,}}

\ExplSyntaxOff

\xdef\@classoptionslist{twoside,twocolumn,11pt,a4paper,\@classoptionslist}
\expandafter\let\csname opt@sbc2025.cls\endcsname\@classoptionslist



\renewcommand{\title}[2][]{%
  \gdef\@shorttitle{#1}
  \gdef\@title{#2}
}

\renewcommand{\author}[2][]{%
  \gdef\@shortauthor{#1}
  \gdef\@author{#2}
}

\newcommand{\affil}[1]{\par\noindent\affilfont#1\par}

\def\@shortauthor{}
\def\@shorttitle{}
\def\@jyear{}
\def\@jnum{}
\def\@jid{}
\def\@jtitle{}
\def\@engtitle{}
\def\@category{}
\def\@copyrightstatement{}
\def\@issn{}
\def\@doi{}

\newcommand{\issn}[1]{\gdef\@issn{#1}}
\newcommand{\doi}[1]{\gdef\@doi{#1}}
\newcommand{\jyear}[1]{\gdef\@jyear{#1}}
\newcommand{\jid}[1]{\gdef\@jid{#1}}
\newcommand{\jtitle}[1]{\gdef\@jtitle{#1}}
\newcommand{\engtitle}[1]{\gdef\@engtitle{#1}}
\newcommand{\category}[1]{\gdef\@category{#1}}
\newcommand{\copyrightstatement}[1]{\gdef\@copyrightstatement{#1}}

\RequirePackage{environ}
\NewEnviron{frontmatter}{\twocolumn[\BODY]\saythanks}

\def\categoryfont{\fontsize{8}{12}\bfseries\selectfont\sffamily\vskip5.5pt\raggedright\mathversion{normal}}

\def\titlefont{\fontsize{18}{20}\bfseries\selectfont\sffamily\raggedright\mathversion{normal}}
\def\engtitlefont{\fontsize{14}{12}\bfseries\selectfont\sffamily\raggedright\mathversion{normal}}
\def\authorfont{\fontsize{10}{8}\selectfont\sffamily\raggedright\mathversion{normal}}
\def\affilfont{\footnotesize\raggedright\mathversion{normal}}

%\usepackage{scrextend}
%\deffootnote{0em}{1.6em}{\thefootnotemark.\enskip
%\deffootnote{1.5em}{1em}{\thefootnotemark.\ }
%\deffootnotemark{\textsuperscript{(\thefootnotemark)}}


\def\abstractfont{\small\rightskip5.5pc}
\def\keywordfont{\small\rightskip5.5pc}
\def\mailfont{\small\rightskip5.5pc\itshape}
\def\datefont{\footnotesize\rightskip5.5pc}
\def\licensefont{\bfseries\small}

%% Section

%\usepackage{sectsty}


\def\sectionfont{\fontsize{14}{14}\sffamily\bfseries\rightskip1pc plus1fill\mathversion{bold}}
\def\subsectionfont{\fontsize{12}{12}\sffamily\bfseries\rightskip1pc plus1fill\mathversion{bold}}
\def\subsubsectionfont{\sffamily\bfseries\normalsize\itshape\rightskip1pc plus1fill\mathversion{normal}}
\def\paragraphfont{\bfseries\normalsize\itshape\mathversion{normal}}%
\def\subparagraphfont{\normalsize}%
\def\subsubparagraphfont{\normalsize}%
\def\bibliofont{\small}
\def\tabnotefont{\footnotesize}

\renewcommand{\@maketitle}{%
  \rule{\linewidth}{.27pt}\vspace{2pt}
  %{\textsc{\categoryfont\@category\par}}
 {\categoryfont\scshape\@category\par}

  \vskip4pt
  {\titlefont\@title\par}
%  {\textit{\engtitlefont\@engtitle\par}}
  \vskip6pt
  {\engtitlefont\itshape{\@engtitle}\par}
  \vskip3.7pt
  \vspace{5.5pt}
  {\authorfont\@author\par}
%  \vskip1pt
}


\gdef\abstractname{}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\abstractname{}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\abstractname{}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\abstractname{}}
%\renewcommand{\abstractname}{}

\gdef\tablename{Table}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\tablename{Table}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\tablename{Tabela}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\tablename{Tabela}}
%\renewcommand{\tablename}{Tabela}

\gdef\figurename{Figure}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\figurename{Figure}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\figurename{Figura}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\figurename{Figura}}
%\renewcommand{\figurename}{Figura}

\gdef\refname{References}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\refname{References}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\refname{Refer\^encias}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\refname{Referencias}}
%\renewcommand{\refname}{Refer\^encias}

\fancyhf{}
\pagestyle{fancy}
\renewcommand{\headrulewidth}{0pt}
%\fancyhead[LE,RO]{\thepage}
%\fancyhead[LO]{\itshape\@shorttitle}
%\fancyhead[RE]{\itshape\@shortauthor}
\fancyhead[L]{\footnotesize\itshape\@shorttitle}
\fancyhead[R]{\footnotesize\itshape\@shortauthor}
\fancypagestyle{plain}{%
  \setlength{\headheight}{36.90002pt}
  \addtolength{\topmargin}{-8.90002pt}
  \fancyhf{}
  \lhead[L]{\footnotesize%
    \emph{\vskip6pt \@jtitle}\ifdefempty{\@jid}{}%
    %\ifdefempty{\@issn}{}{\par \vskip3pt ISSN:\space\href{https://portal.issn.org/resource/ISSN/\@issn}{\@issn}}%
    %\ifdefempty{\@doi}{}{~~$\bullet$~~doi:\space\href{https://doi.org/\@doi}{\@doi}}\\%
											  
    \scriptsize \ifdefempty{\@copyrightstatement}{}{\vskip3pt \faCreativeCommons~~\@copyrightstatement.\\}%
  }
% \cfoot{\thepage}
  \cfoot{}
}

\renewcommand{\abstitlestyle}[1]{\textbf{#1}}
\renewcommand{\abstractnamefont}{\bfseries}
\renewcommand{\abstracttextfont}{\abstractfont}
\setlength{\absleftindent}{0pt}
\setlength{\absparindent}{0pt}
\apptocmd{\abstract}{\noindent\ignorespaces}{}{}
\appto{\endabstract}{\vskip2pt}

\newenvironment{mail}{%
  \vskip4pt\noindent\mailfont{\textcolor{blue}{\faEnvelopeO}~}%
}{\vskip-6pt}

\newenvironment{abstract-pt}{%
 \vskip16pt\noindent\keywordfont{\sffamily\textbf{Resumo. }}%
}{\vskip-6pt}

\newenvironment{abstract-en}{%
  \vskip16pt\noindent\keywordfont{\sffamily\textbf{Abstract. }}%
}{\vskip10pt}

\newenvironment{pchaves}{%
  \noindent\keywordfont{\sffamily\textbf{Palavras-chave: }}%
}{\vskip4pt}

\newenvironment{keywords}{%
  \noindent\keywordfont{\sffamily\textbf{Keywords: }}%
}{\vskip2pt \rule{\linewidth}{.27pt}\vskip2pt }

\newenvironment{dates}{\vskip2pt\noindent\datefont}%
{\vskip0pt \rule{\linewidth}{.27pt}\vskip12pt}

\newenvironment{license}{%
  \noindent\licensefont{\faCreativeCommons}%
}{\vskip6pt \rule{\linewidth}{.27pt}\vskip12pt }

\captionsetup*[figure]{font=footnotesize,labelfont=bf,labelsep=period,skip=2pt}
\captionsetup*[table]{font=small,position=top,labelfont=bf,labelsep=period,skip=2pt}


\gdef\ackname{Declarations}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\declname{Declarations}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\declname{Declarações complementares}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\declname{Declaraciones complementarias}}
\newenvironment{declarations}{\section*{\declname}\small}{}

\gdef\ackname{Acknowledgements}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\ackname{Acknowledgements}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\ackname{Agradecimentos}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\ackname{Agradecimientos}}
\newenvironment{acknowledgements}{\subsection*{\ackname}\small}{}

\gdef\fundingname{Funding}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\fundingname{Funding}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\fundingname{Financiamento}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\fundingname{Financiación}}
\newenvironment{funding}{\subsection*{\fundingname}\small}{}

\gdef\contributionsname{Authors' Contributions}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\contributionsname{Authors' Contributions}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\contributionsname{Contribuições dos autores}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\contributionsname{Contribuciones de los autores}}
\newenvironment{contributions}{\subsection*{\contributionsname}\small}{}

\gdef\interestsname{Competing interests}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\interestsname{Competing interests}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\interestsname{Conflitos de interesse}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\interestsname{Conflictos de intereses}}
\newenvironment{interests}{\subsection*{\interestsname}\small}{}

\gdef\materialsname{Availability of data and materials}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\materialsname{Availability of data and materials}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\materialsname{Disponibilidade de dados e materiais}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\materialsname{Disponibilidad de datos y materiales}}
\newenvironment{materials}{\subsection*{\materialsname}\small}{}

\gdef\furthername{Further relevant information}
\expandafter\addto\csname captions\@SBCen\endcsname{\gdef\furthername{Further relevant information}}
\expandafter\addto\csname captions\@SBCpt\endcsname{\gdef\furthername{Outras informações relevantes}}
\expandafter\addto\csname captions\@SBCes\endcsname{\gdef\furthername{Otra información relevante}}
\newenvironment{furtherinformation}{\subsection*{\furthername}\small}{}

\titleformat{\section}
  {\sectionfont}
  {\thesection}
  {0.5em}
  {{#1}}

\titleformat{\subsection}
  {\subsectionfont}
  {\thesubsection}
  {0.5em}
  {#1}

\titleformat{\subsubsection}
  {\subsubsectionfont}
  {\thesubsubsection}
  {0.5em}
  {#1}

\titleformat{\paragraph}[runin]
  {\paragraphfont}
  {\theparagraph}
  {0.5em}
  {#1}
  
\titlespacing*{\section}{0pt}{10pt}{4pt}
\titlespacing*{\subsection}{0pt}{8pt}{1pt}
\titlespacing*{\subsubsection}{0pt}{7pt}{1pt}
\titlespacing*{\paragraph}{0pt}{6pt}{.5em}

\apptocmd{\quotation}{\setlength{\parindent}{0pt}%
\noindent\ignorespaces}{}{}
\patchcmd{\quotation}{\rightmargin\leftmargin}{\rightmargin0pt}{}{}
\setlist{noitemsep}
\newlist{unnumlist}{itemize}{1}
\setlist[unnumlist]{label={},leftmargin=2em,itemindent=-1em}

\def\x{@{\extracolsep{\fill}}}

\newcommand{\tabnote}[1]{\par\vskip1pt{\raggedright\tabnotefont #1\par}}

\RequirePackage{natbib}
\setlength{\bibsep}{0.3mm}

%\frenchspacing

\addtolength{\textfloatsep}{-0.0cm}
\setlength\textfloatsep{0.2cm}

\endinput
