# Blitz-basic
Blitz-basic defines an API endpoint service which compiles repository data from the GitHub API of a specific user's public profile.
To do so, the app requires one URL parameter with a second optional: 
  The first is the username of the GitHub user, like 'MasonRKH'.
  The second, optional parameter is a specification request which allows the inclusion of repositories that are forked (forked repositories are ignored by default)
    The following forked URL parameters are valid: true, t, fork, forks, forked
  
  With the Heroku app link, a user request may look similar to:
    https://blitz-basic.herokuapp.com/masonRKH/forked

This program can be run on a local host with the following dependencies: 
  node.js ^12.x
  node-fetch ^2.x
  express ^4.x
  
