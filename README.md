# RabbitMQ Web Admin

## Installation

* Install
  * [Node.js](http://nodejs.org): `brew install node` on OS X
  * Install dependencies: `npm install` in application directory
* Run
  * `PORT=3000 AMQP_URI=amqp://localhost ./server.js`





## Development setup

* The backend is a Node.js express server using JSON over AJAX and WebSockets.
* The frontend is a single page application using ReactJS, built with the [Brunch](http://brunch.io) javascript build tool.

## Getting started
* Install (if you don't have them):
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Brunch](http://brunch.io): `npm install -g brunch`
    * [Bower](http://bower.io): `npm install -g bower`
    * Brunch plugins and Bower dependencies: `npm install & bower install`.
* Run:
    * `brunch watch --server` — watches the project with continuous rebuild. This will also launch HTTP server with [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history).
    * `brunch build --production` — builds minified project for production
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Place static files you want to be copied from `app/assets/` to `public/`.
    * [Brunch site](http://brunch.io)
