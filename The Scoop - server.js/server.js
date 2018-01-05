// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  comments: {},
  nextArticleId: 1,
  nextCommentId: 1
};

/*//DATABASE HIERARCHY FOR SANITY CHECKS
database = {
  users: {
    username1: {
    username: username,
    articleIds: [],
    commentIds: []
    },
    username2: {
    username: username,
    articleIds: [],
    commentIds: []
    }
  },  //end users
  articles: {
    1: {
      id: 1,
      title: title,
      url: url,
      username: username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    },
    2: {
      id: 2,
      title: title,
      url: url,
      username: username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    }
  },  //end articles
  comments: {
    1: {
      id: 1,
      body: body,
      username: username,
      articleId: articleId,
      upvotedBy: [],
      downvotedBy: []
    },
    2: {
      id: 2,
      body: body,
      username: username,
      articleId: articleId,
      upvotedBy: [],
      downvotedBy: []
    }
  }  //end comments
};  //end database
*/

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  '/comments': {
    'POST': createComment,
  },
  '/comments/:id': {
    'PUT': updateComment,
    'DELETE': deleteComment
  },
  '/comments/:id/upvote': {
    'PUT': updateUpvote,
  },
  '/comments/:id/downvote': {
    'PUT': updateDownvote,
  }
};

//////////MY CODE////////////////////MY CODE////////////////////MY CODE//////////
function createComment(url, request) {
  //if request.body is false-y, returns value of request.body (undefined/null probably)
  //if request.body is truth-y, returns value of request.body.comment
  const newComment = request.body && request.body.comment;
  const response = {};
  //if body is supplied, username exists, and article exists,
  //then:
  // 1) create the comment
  if (newComment && newComment.body
    && newComment.username && database.users[newComment.username]
    && newComment.articleId && database.articles[newComment.articleId]) {
        const comment = {
          id: database.nextCommentId++,
          body: newComment.body,
          username: newComment.username,
          articleId: newComment.articleId,
          upvotedBy: [],
          downvotedBy: []
        };
      // 2) add it to database
      // 3) add commend.id to user's list of comments
      // 4) add comment.id to articles's list of comments
      database.comments[comment.id] = comment;
      database.users[comment.username].commentIds.push(comment.id);
      database.articles[comment.articleId].commentIds.push(comment.id);

      response.status = 201;
      response.body = {comment: comment}; //?? why object within object?
      return response;
    } else {
      response.status = 400;
      return response;
    }
};

function updateComment(url, request) {
  //example url: /comments/1
  //why?  confused how url is getting passed to function.
  //.filter being used so empty arguments are not passed along.
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedComment = database.comments[id];
  const editComment = request.body && request.body.comment;
  const response = {};

  //if id is not supplied, or if a new comment is not supplied, return 200 response.
  if (!editComment || !id || !editComment.body) {
    response.status = 400;
    return response;
    //if the id supplied does not exist, return 404 response.
  } else if (!savedComment) {
    response.status = 404;
    return response;
  } else {
    savedComment.body= editComment.body;
    response.status = 200;
    response.body = {comment: savedComment};
    return response;
  };
};

function deleteComment(url, request) {
  //example url: /comments/1
  //why?  confused how url is getting passed to function.
  //.filter being used so empty arguments are not passed along.
  //console.log('this is the request body ' + request);
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedComment = database.comments[id];
  const response = {};
  //if id is not given, or comment doesn't exist, return 404.
  if (savedComment) {
    //create new array of comment id's, filtering the value to 'delete'
    //overwrite existing array
    let newArticleCommentIDs = database.articles[savedComment.articleId].commentIds.filter(
      num => num !== savedComment.id);
    database.articles[savedComment.articleId].commentIds = newArticleCommentIDs;

    //create new array of comment id's, filtering the value to 'delete'
    //overwrite existing array
    let newUserCommentIDs = database.users[savedComment.username].commentIds.filter(
      num => num !== savedComment.id);
    database.users[savedComment.username].commentIds = newUserCommentIDs;

    //now delete comment itself
    database.comments[id] = null;

    response.status = 204;
    return response;
  } else {
    response.status = 404;
    return response;
  }
};

function updateUpvote(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const comment = database.comments[id];
  const username = request.body && request.body.username;
  const response = {};
  if (!username || !id || !comment || !database.users[username]) {
    response.status = 400;
    return response;
  } else {
      if (comment.upvotedBy.includes(username)) {
        return;
      } else {
        if (comment.downvotedBy.includes(username)) {
          let newDownvotes = comment.downvotedBy.filter(
            user => user !== username);
            comment.downvotedBy = newDownvotes;
        }
        comment.upvotedBy.push(username);
      }
    response.status = 200;
    response.body = {comment: comment};
    return response;
  };
};

function updateDownvote(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const comment = database.comments[id];
  const username = request.body && request.body.username;
  /* OBJECTS ARE STUPID
  console.log('This is the request for updateDownvote ' + request);
  console.log('username: ' + username);
  console.log('!request: ' + !request);
  console.log('request == null:' + (request==null));
  console.log('request == undefined:' + (request==undefined));
  console.log('request == {}:' + (request=={}));
  console.log('!username: ' + !username);
  console.log('!database.users[username]: ' + !database.users[username]);
  console.log('!comment: ' + !comment);
  console.log('!id: ' + !id);
  */
  const response = {};
  if (!username || !id || !comment || !database.users[username]) {
    response.status = 400;
    return response;
  } else {
      //if already downvoted by this user, do nothing.
      if (comment.downvotedBy.includes(username)) {
        return;
      } else {
        //if previously upvoted by this user, remove their name from comment's upvote list.
        if (comment.upvotedBy.includes(username)) {
          let newUpvotes = comment.upvotedBy.filter(
            user => user !== username);
            comment.upvotedBy = newUpvotes;
        }
        //..finally, add user to downvote list.
        comment.downvotedBy.push(username);
      }
    response.status = 200;
    response.body = {comment: comment};
    return response;
  };
};
//////////MY CODE////////////////////MY CODE////////////////////MY CODE//////////


function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  //if request.body is false-y (null), returns null.
  //if request.body is truth-y, returns request.body.article.
  const requestArticle = request.body && request.body.article;
  const response = {};
  //if request.body.article contains all required values,
  //create a new article object.  also checks that user is in database (registered).
  //saves the new article object to database - it's key is it's id number.
  //adds the article.id to the user's submitted articles.
  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++, //guessing this increments database.nextArticleId itself...?
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}



function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});
