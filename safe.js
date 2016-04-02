/******************************************************************************************* 
 * The MIT License (MIT)
 * -----------------------------------------------------------------------------------------
 * Copyright (c) 2016 Convergence Modeling LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the "Software"), to deal in the 
 * Software without restriction, including without limitation the rights to use, copy, 
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, 
 * and to permit persons to whom the Software is furnished to do so, subject to the 
 * following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE 
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *  
 * https://opensource.org/licenses/MIT
 * 
 */
 
 
 
 

// /////////////////////////////////////////////////////////////////
// State-Action Fabric Element 
// SAFE is a micro-container for server-side SAM implementations
// 
// SAFE implements the following services
//  - action dispatcher 
//  - action hang back
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




// minimal service implementations

// session manager 

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

// logger

safe.defaultLogger = {
    output: (level,message) => {
        var timestamp = new Date().getTime() ;
        var m = message ;
        if (typeof message !== 'string') {
            m = JSON.stringify(message) ;
        }
        console.log([level,timestamp,m].join(' : ')) ;
    },
    warning: (message) => {
        if (safe.logger.loggingLevel <=1) { safe.logger.output('[WARNING] ',message) ; }
    },
    info: (message) => {
        if (safe.logger.loggingLevel <=0) { safe.logger.output('[INFO]    ',message) ; }
    },
    error: (message) => {
        if (safe.logger.loggingLevel <=2) { safe.logger.output('[ERROR]   ',message) ; }
    },
    loggingLevel: 0
} ;

safe.defaultErrorHandler = (message) => {
   safe.logger.error(message) ; 
} ;


// SAFE Core

safe.init = (actions, model, state, view, logger, errorHandler, sessionManager, timeTraveler) => {
    
    safe.actions = actions ;
    safe.model = model ;
    safe.state = state ;
    safe.view = view ;
    
    safe.errorHandler = errorHandler || safe.defaultErrorHandler ;
    
    safe.logger = logger || safe.defaultLogger ;
    
    safe.hangback = false ;
    safe.steps = [] ;
    safe.stepCount = 0 ;
    safe.lastStep = safe.newStep(safe.stepCount) ;
    
    safe.sessionManager = sessionManager || safe.defaultSessionManager ;
    
    if (timeTraveler) {
        safe.saveSnapshot = timeTraveler.saveSnapshot ;
        safe.getSnapshot = timeTraveler.getSnapshot ;
    } 
    
    safe.allowedActions = null ;
    
    if (actions) {
        if (model) {
            actions.init(safe.present) ;       
        }
    } 
    
    if (state) {
        
        if (model) {
            model.init(safe.render) ;
            state.init(safe.render, safe.view) ;
        }
        
        if (view) {
            if (actions) {
                state.init(null,view, safe.display, actions.intents) ;
            } else {
                state.init(null,view, safe.display) ;
            }
        }
        
        safe.allowedActions = state.allowedActions || [] ;
    }
} ;


// Insert SAFE middleware and wire SAM components

safe.dispatcher = (app,path,next) => {
    // assumes express cookie-parser middleware
    
    app.post(path, function(req,res) { 
        var ret = (representation) => {
                        res.status(200).send(representation) ;
                    } ;
        var data = req.body ;
        
        safe.logger.info(req.body) ;

        data.__token = req.cookies['safe_token'] || '' ;
        
        safe.dispatch(data.__action,data,next || ret) ;
    }) ;
    
} ;

safe.dispatch = (action,data,next) => {
    data = data || {} ;
    var dispatch = false ;
    const lastStepActions = safe.lastStep.actions ; 

    safe.logger.info('dispatcher received request'+JSON.stringify(data)) ;
    safe.logger.info('lastStepActions            '+JSON.stringify(lastStepActions)) ;
    if (lastStepActions.length === 0) {
        // action validation is disabled
        dispatch = true ;
    } else {
        lastStepActions.forEach( (a) => {
            safe.logger.info(a) ;
            if (a.action === action) {
                dispatch = true ;
                // tag the action with the stepid
                // we want to enforce one action per step
                // if the step does not match we should not dispatch
                data.__actionId = a.uid ;
                safe.logger.info('tagging action with            '+JSON.stringify(a)) ;
            
                safe.lastStep.dispatched = action ;
            }
        }) ;
    }
    if (!dispatch) {
        safe.errorHandler({action: action, error: "not allowed"}) ;
    } else {
        var invoked = false ;
            
        if (safe.actions[action] !== undefined) {
            
            // dispatch action
            safe.logger.info('invoking action            '+JSON.stringify(data)) ;
            safe.actions[action](data,next) ;
            invoked = true ;
        } 
        
        if (!invoked) { safe.errorHandler({action: action, error: "not found"}) ;  }
        
    }

} ;


safe.present = (data,next) => {
    const actionId = data.__actionId || null ;
    
    if (!safe.blocked) {
        const lastStepActions = safe.lastStep.actions ; 
        safe.logger.info(lastStepActions) ;
        var presentData = (lastStepActions.length === 0) ;
        if (!presentData) { 
            // are we expecting that action?
            lastStepActions.forEach(function(el) {
                if (el.uid === actionId) {
                    presentData = true ;
                }
            }); 
        }
        if (presentData) {
            safe.block() ;
            if (data.__token) {
                safe.model.__session = safe.sessionManager.rehydrateSession(data.__token) ;
                safe.model.__token = data._token ;
                
            }
            
            safe.model.present(data,next) ;
        } else {
            // unexpected actions
            // possibly an action from previous step that needs to be blocked
        }
    } else {
        // ignore action's effect
        safe.logger({blocked: true,data}) ;
    }    
} ;

safe.render = (model,next) => {
    safe.allowedActions = safe.state.representation(model,next) || [] ;
    safe.unblock() ;
    safe.lastStep = safe.newStep(safe.stepCount++, safe.allowedActions)
    safe.sessionManager.dehydrateSession(model) ;
    safe.state.nextAction(model) ;
} ;

safe.display = (representation,next) => {
    safe.view.display(representation,next) ;
} ;

safe.block = () => {
    safe.lastStep.actions = [] ;
    safe.blocked = true ;
} ;

safe.unblock = () => {
    safe.blocked = false ;
} ;

safe.newStep = (uid,allowedActions) => {
    allowedActions = allowedActions || [ ] ;
    var k = 0 ;
    var step = { 
        stepid: uid , actions: allowedActions.map((action) => {
            var auid = uid + '_' + k++ ;
            return { action, uid: auid } ;   
    })  } ;
    
    safe.steps.push(step) ;
    safe.logger.info('new step        :'+JSON.stringify(step)) ;
    return step ;
} ;



module.exports = safe ;