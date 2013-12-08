# crate.ly (landing page)

Crate.ly - All the online music in one place (discontinued)

This brach is **only** the static page or landing page which you can see on crate.ly<br/>
The server and web app are on this brach: [app](/brach/app)

## Project's Objective

The idea came about while doing an internship in my 3rd year in DIT. When you find a great track on your work computer either on SoundCloud, YouTube or else, there really no good way to organise those tracks so you can later download them, find more from the artist or DJ.

So the initial goal was to be able to quickly mark songs to "Listen To It Later". Following the domain not being available I thought the act of putting records in a "crate" could mean archiving songs for later.

To quickly mark songs, the first implementation was to done via a browser Bookmarklet.

## Technologies

### Front-end:

- [Knockout.js](knockoutjs.com) for the JavaScript Framework
- jQuery
- [Grunt](http://gruntjs.com) (which requires npm, [node](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager))

### Hosting:

- AWS S3
- DNS: Cloudflare

## Quick start

Run these commands:

	npm install
	grunt static
	python -m SimpleHTTPServer

Open [http://0.0.0.0:8000](http://0.0.0.0:8000)