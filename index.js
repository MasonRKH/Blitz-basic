/**
* @file Heroku app frontend process to send JSON data based on URL parameters
* @author Mason Holter
*/
const express = require('express')
const data = require('./getJson')
const PORT = process.env.PORT || 5000

/**
* Opens express connection, receives URL parameters and calls getJson.js functions.
*   Responds either error JSON with HTTP response code or complete JSON
*/
express()
  .get('/:username/:forked?', (req, res, next) =>
    data.compile(req.params.username, req.params.forked, async function (error, json) {
      if (await error) {
        res.status(error)
        res.json({
          code: error,
          path: '/' + req.params.username,
          message: 'GitHub API request failed, check username parameter'
        })
      } else if (await json) {
        res.json(json)
      }
    }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
