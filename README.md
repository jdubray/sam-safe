# SAFE - A micro-container for Node.js SAM Implementations

SAFE implements the following services
  - element wiring
  - action dispatcher 
  - session dehydration / hydration
  - enforces allowed actions and action hang back
  - logging
  - server side time travel

Coming up
  - caching (idempotent actions)

## Running the sample

You should run a version of node up to v5.11.1. SAFE is not incompatible with v6 but other libraries that the sample is using might.

```
npm install
node server-model
```

then use Chrome to open the file (not all browsers support some of the ES6 features used): blog.html

## SAFE Usage

The SAM pattern can be deployed with [a variety of topologies](http://sam.js.org/#iso). The blog sample implements its Actions on the client, while the Model and the State are implemented on the server.

SAFE can be used to wire the SAM elements
```
// note that actions can also implemented on the client
// in which case the value would be null
// var actions = null 

var actions = require('./actions') ;  
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

### Time Travel

Time Travel is a developer tool that allows you to put back the application state as it was in a given step. This approach was popularized by Dan Abramov
as part of the Redux framework. However, in Redux time travel works only on the client while in SAFE it can run both on the client or server.

```
// Time Travel is initialized in a couple of lines (server-model.js)

var myTimeTraveler = safe.defaultTimeTraveler() ; // or your implementation
safe.initTimeTraveler(myTimeTraveler) ;

// add the express route to access the model versions
myTimeTraveler.init(app,your_path_to_timetravel_snapshots) ;

// SAFE's implements an in memory defaultSnapShotStore, which you can
replace with your own, including a persistent one...
```

SAFE's defautTimeTravel implementation adds a "Time Travel" component to all state representations. 
![timetravel](https://github.com/jdubray/sam-safe/blob/master/timetravel.jpg)

You can also access the time travel store via a simple api:

Return all snapshots: `http://localhost:5425/dev/v1/timetravel/snapshots/`

Return a single snapshot: `http://localhost:5425/dev/v1/timetravel/snapshots/{index}`

