// rsvp-fn: API Gateway routes /api/invitations/:token[/rsvp] and /api/events/:eventId/{rsvps,waitlist,capacity}.
const { createApp, toLambdaHandler } = require('../../../shared');
const routers = require('..');

exports.handler = toLambdaHandler(createApp(routers));
