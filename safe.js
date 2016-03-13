// /////////////////////////////////////////////////////////////////
// State-Action Fabric Element 
// SAFE is a micro-container for server-side SAM implementations
// 
// SAFE implements the following services
//  - action dispatcher 
//  - session dehydration / hydration
//  - enforces allowed actions
//  - logging
//
//  TODO
//  - server side time travel
//  - caching (idempotent actions)


'use strict' ;

// import { saveSnapshot, getSnapshot } from './timeTravelStore.js'  ;

let safe = {} ;

let saveSnapshot, getSnapshot ;
// minimal session manager for debugging

safe.defaultSessionManager = {
    
    dehydrateSession: (model) => {
        if (model.__token) {
            safe.defaultSessionManager[model.__token] = model.__session ;
        }
    },
    
    rehydrateSession: (token) => {
        let session =  safe.defaultSessionManager[token] ;
        return session ; 
    }
    
} ;

safe.init = (actions, model, state, view, logger, errorHandler, sessionManager, timeTraveler) => {
    
    safe.actions = actions ;
    safe.model = model ;
    safe.state = state ;
    safe.view = view ;
    safe.errorHandler = errorHandler || null ;
    safe.logger = logger || null ;
    
    safe.sessionManager = sessionManager || safe.defaultSessionManager ;
    
    if (timeTraveler) {
        saveSnapshot = timeTraveler.saveSnapshot ;
        getSnapshot = timeTraveler.getSnapshot ;
    } 
    
    safe.allowedActions = null ;
    
    if (actions) {
        if (model) {
            actions.present = safe.present ;       
        }
    } 
    if (state) {
        
        if (model) {
            model.init(safe.render) ;
            state.render = safe.render ;
        }
        
        if (view) {
            state.init(view) ;
            state.display = safe.display ;
        }
        
        safe.allowedActions = state.allowedActions || [] ;
    }
} ;


// Insert SAFE middleware and wire SAM components

safe.dispatcher = (app,path,next) => {
    // assumes express cookie-parser middleware
    app.post(path, function(req,res) { 
        var data = req.body.data ;
        data.__token = req.cookies['safe_token'] ;
        safe.dispath(req.body.action,data,next) ;
    }) ;
    
}

safe.dispatch = (action,data,next) => {
    
    var dispatch = false ;
    
    if (safe.allowedActions) {
        safe.allowedActions.forEach(function(a) {
            if (a === action) {
                dispatch = true ;
            }
        });
        if (!dispatch) {
            safe.errorHandler({action: action, error: "not allowed"}) ;
        }
    } else {
        dispatch = true ; 
    }
    
    if ((safe.actions[action] !== undefined) && dispatch) {
        safe.logger({action,data}) ;
        safe.actions[action](data,next) ;
    }
    
} ;


safe.present = (data,next) => {
    
    if (data.__token) {
        safe.model.__session = safe.sessionManager.rehydrateSession(data.__token) ;
        safe.model.__token = data._token ;
        
    }
    
    safe.model.present(data,next) ;
} ;

safe.render = (model,next) => {
    
    safe.sessionManager.dehydrateSession(model) ;
    
    safe.allowedActions = safe.state.representation(model,next) || [] ;
    safe.state.nextAction(model) ;
} ;

safe.display = (representation,next) => {
    //console.log('safe display ->') ;
    safe.view.display(representation,next) ;
} ;

module.exports = safe ;