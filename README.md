# SAFE - A micro-container for Node.js SAM Implementations

SAFE implements the following services
  - element wiring
  - action dispatcher 
  - session dehydration / hydration
  - enforces allowed actions
  - logging

Coming up
  - server side time travel
  - caching (idempotent actions)

## Usage

The SAM pattern can be deployed with [a variety of topologies](http://sam.js.org/#iso). The blog sample implements its Actions on the client, while the Model and the State are implemented on the server.

SAFE can be used to wire the SAM elements
```
var actions = null ; // no actions running on the server
var model = require('./model') ;
var view = require('./view') ;
var state = require('./state') ;
var safe = require('./safe') ;

safe.init(actions,model,state,view) ;
```

### Dispatcher

The dispatcher can be used to simplify the invocation of the server-side actions from the client's event handlers

### Session Management

A session manager can be plugged into SAFE to manage session rehydration/hydration.

### Allowed Actions

Currently SAFE can be used enforce global action authorization (not yet session based)

### Action Hang Back

SAFE supports a mode where the client can call multiple allowed actions in a given step. The first one to present its values "wins" and prevents any other 
action to present its values to the model
