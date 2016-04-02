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

The dispatcher can be used to simplify the invocation of the server-side actions from the client's event handlers.

On the server, the dispatcher is activated via a simple call where apis.dispatch is the path you assign to the dispatcher (server-model.js):

```
safe.dispatcher(app,apis.dispatch) ;
```

In your client, add a simple dispatcher function (blog.html):
```
function dispatch(data) {
    
    // invoke SAFE's dispatcher
    $.post( "http://localhost:5425/app/v1/dispatch", data) 
    .done(function( representation ) {
        $( "#representation" ).html( representation );
    }        
    );
}

```

then route all your actions to the dispatcher (blog.js) and add the __action property to your dataset:
```
actions.save = (data) => {
    data.__action = 'save' ;
    actions.do(data) ; 
    return false ;
} ;
```

### Session Management

A session manager can be plugged into SAFE to manage session rehydration/hydration.

### Allowed Actions

Currently SAFE can be used enforce global action authorization (not yet session based)

### Action Hang Back 

SAM inherently supports a mode where the client can call multiple allowed actions in a given step. With SAFE, the first one to present its values "wins" and prevents any other action to present its values to the model.

For instance, the Blog Sample, the save action simulates a slow behavior:

```
actions.save = (data,next) => {
    data.item = {title: data.title, description: data.description, id: data.id || ''} ;
    if (data.item.id !== '') {
        // simulate a slow save after
        // editing an item
        setTimeout(function() { 
            actions.present(data,next) ;
        }, 9000);
    }
    else {
        // proceed as normal when created a new item
        actions.present(data,next) ;
    }
    return false ;
} ;
```

When you modify a blog entry and you hit save, the action will present its data 9s later. If you hit cancel before the save action presents its values to the model, then the save action will be prevented from presenting its actions to the
model.
