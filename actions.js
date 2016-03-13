// 

var actions = {} ;

actions.present = (data) => {
    return false ;
} ;

actions.edit = function(data,next) {
    data.lastEdited = {title: data.title,  description: data.description, id: data.id } ;
    actions.present(data,next) ;
    return false ;
} ;

actions.save = function(data,next) {
    data.item = {title: data.title, description: data.description, id: data.id || null} ;
    actions.present(data,next) ;
    return false ;
} ;

actions.delete = function(data,next) {
    data = {deletedItemId: data.id} ;
    actions.present(data,next) ;
    return false ;
} ;

actions.cancel = function(data,next) {
    actions.present(data,next) ;
    return false ;
} ;

module.exports = actions ;