////////////////////////////////////////////////////////////////////////////////
// State
//
var state =  { } ;

state.init = function(view) {
    state.view = view ; 
    state.display = view.display ;
} ;

// Derive the state representation as a function of the systen
// control state
state.representation = function(model,next) {
    var representation = 'oops... something went wrong, the system is in an invalid state' ;

    if (state.ready(model)) {
        representation = state.view.ready(model) ;
    } 
    
    state.display(representation,next) ;
} ;

// Derive the current state of the system
state.ready = function(model) {
   return true ;
} ;


// Next action predicate, derives whether
// the system is in a (control) state where
// a new (next) action needs to be invoked

state.nextAction = function(model) {} ;

state.render = function(model,next) {
    state.representation(model,next) ;
    state.nextAction(model) ;
} ;

module.exports = state ;