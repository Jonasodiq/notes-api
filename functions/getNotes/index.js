// const middy = require("middy");
// const { authMiddleware } = require("../../utils/middleware");

// const handler = async (event) => {
//   // event.user.email finns nu här!
//   return {
//     statusCode: 200,
//     body: JSON.stringify({ message: "Protected OK", user: event.user })
//   };
// };

// module.exports.handler = middy(handler).use(authMiddleware());


const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");

const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Protected OK",
      user: event.user
    })
  };
};

module.exports.handler = middy(handler)
  .use(authMiddleware())
  .onError((handler, next) => {
    const status = handler.error.statusCode || 500;

    handler.response = {
      statusCode: status,
      body: JSON.stringify({
        response: {
          message: handler.error.message || "Unknown error"
        }
      })
    };

    return next();
  });
