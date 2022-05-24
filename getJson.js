/**
* @file Compiles data from aggregated GitHub repositories, supplied by user requested
*   username
* @author Mason Holter
*/
const fetch = require('node-fetch') // requires node-fetch@2
exports.compile = intakeRequest

/**
* Creates GitHub repository API URL from request parameters:
*   {@index.js req.params.username, req.params.forked}
*   Calls validateRequest from forked request content
*
* @param {string} username - requested GitHub user
* @param {string} forked - compilation specification request
* @param {function(Object, int)} callback - callback used to respond JSON/error code
*/
async function intakeRequest (username, forked, callback) {
  const url = 'https://api.github.com/users/' + username + '/repos?per_page=100'
  if (['true', 'forked', 't', 'fork', 'forks'].includes(forked)) {
    validateRequest(url, true, callback)
  } else {
    validateRequest(url, false, callback)
  }
}

/**
* Validates requested URL by attempting connection. Invalid links respond with relavent
*   error code
*
* @param {string} username - requested GitHub user
* @param {string} forked - compilation type specification request
* @param {function(Object, int)} callback - callback used to respond JSON/error code
* @return {null} null - in case of error, ends fetch process
*/
function validateRequest (url, forked, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        callback(response.status, null)
        return
      }
      collectPaginateContent(response, forked)
        .then(api => callback(null, api))
    })
    .catch(error => console.error(error))
}

/**
* Iterates through possible paginated data from GitHub API. Appends all entries to
*   repository JSON object
*
* @param {object} repositories - API page object
* @param {string} forked - compilation type specification request
* @return {function(object, string)} compileData - collects all data from aggregate JSON
*   object
*/
async function collectPaginateContent (repositories, forked) {
  const primaryJson = await repositories.json()
  let nextRepositoryLink = parseNext(await repositories.headers)

  while (nextRepositoryLink != null) {
    const currRepository = await fetch(nextRepositoryLink)
    const currJson = await currRepository.json()
    primaryJson.push(...currJson)
    nextRepositoryLink = parseNext(nextRepositoryLink.headers)
  }

  return compileData(primaryJson, forked)
}

/**
* Attempts to return link to next page of repository JSON data.
*
* @param {object} header - header object
* @return {string} link - returns link to next page
*/
function parseNext (header) {
  if (header.get('link') != null) {
    const linkList = header.get('link').split(',')
    for (const link of linkList) {
      if (link.includes('next')) {
        return link.substring(link.indexOf('https'), link.indexOf('>;'))
      }
    }
  }
}

/**
* Collects data at each repository in the agregated JSON object, storing it in a new object
*   instance.
*
* @param {object} file - JSON object
* @param {string} forked - compilation type specification request
* @return {object} finalJson - formatted JSON object
*/
function compileData (file, forked) {
  const languageMap = {}
  var finalJson = {}
  let sizeSum = 0
  finalJson.repository_count = 0; finalJson.forks_count = 0; finalJson.stargazer_count = 0

  file.forEach(repository => {
    if (!forked && parseInt(repository.forks_count) > 0) { return }

    finalJson.repository_count += 1
    finalJson.forks_count += parseInt(repository.forks_count)
    sizeSum += parseInt(repository.size)
    finalJson.stargazer_count += parseInt(repository.stargazers_count)

    if (repository.language in languageMap) {
      languageMap[repository.language] += 1
    } else if (repository.language) {
      languageMap[repository.language] = 1
    }
  })

  finalizeDataObject(finalJson, sizeSum, languageMap)
  return finalJson
}

/**
* Finalizes JSON object format by calling relavent function, sorting languageMap object by
*   descending value, and appending sorted languageMap object to JSON.
*
* @param {object} finalJson - JSON object
* @param {string} forked - compilation type specification request
*/
function finalizeDataObject (finalJson, sizeSum, languageMap) {
  setByteUnit(finalJson, sizeSum)
  languageMap = Object.fromEntries(Object.entries(languageMap).sort((a, b) => {
    return b[1] - a[1]
  }))

  finalJson.languages = languageMap
}

/**
* Converts total size integer to average size per repository, appends appropriate
*   representative memory unit
*
* @param {object} finalJson - JSON object
* @param {int} forked - compilation type specification request
*/
function setByteUnit (finalJson, sizeSum) {
  if (sizeSum / finalJson.repository_count >= 1000000) {
    finalJson.average_repository_size =
      ((sizeSum / finalJson.repository_count) / 1000000).toFixed(2) + ' GB'
  } else if (sizeSum / finalJson.repository_count >= 1000) {
    finalJson.average_repository_size =
      ((sizeSum / finalJson.repository_count) / 1000).toFixed(2) + ' MB'
  } else {
    finalJson.average_repository_size = sizeSum + ' KB'
  }
}
