# What is MicroDoc 
*MicroDoc* is a web-based system for document management.

## Main goal
The main goal of MicroDoc is to *avoid* maintaining traditional *huge documents*, but create a system of small well-known inter-related documents.

## Redesigned documentation structure
Knowledge in MicroDoc stored in a normalized *grid form* (document matrix).

*Rows* of grid (*hierarchical tags*) define *knowledge ontology* which can be:
- module / component / part
- department / process / step
- ...

*Columns* of grid (*document types*) define knowledge taxonomy which can be:
- vision / architecture / usecases (software development domain)
- design / scheme / diagnostics / repair (automobile domain)
- ...

## Multiple domain support
MicroDoc is not constrained to single subject area. You are free to define as much *Domains* as you need, create and explore documents simultaneously:
- software development
- project management
- accounting & finances
- car building
- sport training
- ...

## Simultaneous document editing
The fact that the document is relatively small - allows for simultaneous editing of multiple documents in a browser window

# Server Deployment
- download microdoc.zip
- unzip to some folder
  - microdoc.exe - web server folder
  - microdoc.doc - MicroDoc document library
  - book.doc - book sample document library
  - renovation.doc - renovation sample document library
  - training.doc - training sample document library
- run ServerStart.cmd

This will start local web server and open MicroDoc page in web browser.

Following components required to server run:
- *.NET 11.0 Runtime* https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-11.0.0-windows-x64-installer
- *ASP.NET Core Runtime* https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-aspnetcore-11.0.0-windows-x64-installer
- *.NET 11.0 SDK* https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/sdk-11.0.100-windows-x64-installer

Document library web site is accessible over https://localhost:7273/
Simple login is enabled by default - any login/password accepted.
This is good for local use.

Please, explore MicroDoc documentation right after installation and run [MicroDoc documentation](https://localhost:7273/microdoc.doc)

Next steps
- setup developer certificate (local deployment)
- [Setup Google authentication](https://localhost:7273/microdoc.doc/Server/Deployment/Google%20Auth/architecture.txt)
- [Configure users and roles](https://localhost:7273/microdoc.doc/Domain/Users/usecases.txt)
- [Configure site external access](https://localhost:7273/microdoc.doc/Server/Deployment/External%20Access/architecture.txt)

## Setup developer certificate
You may need to configure development certificate if the server won't start and you see following error in console window:
Unable to configure HTTPS endpoint. 
No server certificate was specified, and the default developer certificate could not be found or is out of date

/code: dotnet dev-certs https --clean
dotnet dev-certs https
dotnet dev-certs https --trust

# Sample domains and Domain Options
Top-level navigation menu of site contains links to sample domains:
- microdoc.doc
- my-new-book
- apt-renovation
- training
- button Edit Domain Options

Please, explore samples and find corresponding sections in Domain Options.
Domain Options is written in yaml format and contains:
- list of Domains
  - root folder of documentation
  - background image (relative to the root folder)
  - list of domain documents (document matrix columns)
  - document options (document colors/hints)
- security settings
- list of users and roles

```
Domains:
- Name: microdoc.doc
  RootFolder: ~/../microdoc.doc
  Background:  _domain+background.jpg
  IsCaseSensitive: false
  TrackTagMoves: false
  Documents: [ vision, architecture, usecases, benefits ]
  DocumentOptions:
  - { Name: vision, 		Color: lightgreen, 	Title: problem - solution }
  - { Name: architecture, 	Color: yellow, 		Title: how implemented }
  - { Name: usecases, 		Color: cyan, 		Title: cases solved }
  - { Name: benefits, 		Color: lightblue, 	Title: what  }
  - { Name: _domain, 		Color: lightgray, 	Title: resources  }
  DocumentLevelSecurity: false

- Name: my-new-book
  RootFolder: ~/../book.doc
  Background:  _domain+background.png
  IsCaseSensitive: true
  TrackTagMoves: false
  Documents: [ ideas, text, comments ]
  DocumentOptions:
  DocumentLevelSecurity: false

- Name: apt-renovation
  RootFolder: ~/../renovation.doc
  Background:  _domain+background.jpg
  IsCaseSensitive: true
  TrackTagMoves: false
  Documents: [ design, materials, shopping, comments ]
  DocumentOptions:
  DocumentLevelSecurity: false

- Name: training
  RootFolder: ~/../training.doc
  Background:  _domain+background.jpg
  IsCaseSensitive: true
  TrackTagMoves: false
  Documents: [ videos, preparation, working, recovery ]
  DocumentOptions:
  DocumentLevelSecurity: false

SimpleLogin: true
DomainLevelSecurity: false
Users:
- { Email: '*',			Roles: rwa }
```

# Document Markup features
Documents are relatively small, and there is no WYSIWYG editor at the moment. 
Document editor is a plain textarea, document markup supports following features:
- Tab, Shift+Tab to indent text
- bold (enclose text in stars, Ctrl+B )
- underline (enclose text in underscores, Ctrl+U )
- code line (enclose text in backticks)
- headings h1/h2/h3 (prefix #/##/###+space)
- document sections (heading and content until next heading/end-of-document is a document sections)
- paragraphs (text after heading is a paragraph, to start new paragraph put an empty line)
- bulleted lists (same syntax as in markdown, Tab/Shift+Tab to indent list item, automatically start new list item on new-line)
- numbered lists - not supported
- tables (| cell 1 | cell2 | cell3 | cell4 and 5 || last cell | - start and end the row with |, separate cells with |, add more ||| to colspan)
- images (copy image to clipboard, paste into document editor, type image name)
- image gallery (paste several images successively)
- statuses (/TODO/ text between slashes)
- code/note/example block (start paragraph with /code: /note: /example:)
- code/note/example section (start heading with # /code: # /note: # /example:)
- encode # inside code block (to avoid parser to start new section encode beginning hash sign /#)
- links to documents (/link: [tag] [subtag] document.txt)
- external links (paste link as is)