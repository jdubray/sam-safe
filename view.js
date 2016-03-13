
////////////////////////////////////////////////////////////////////////////////
// View
//

var view = {} ;

// Initial State
view.init = function(model) {
    return view.ready(model) ;
} ;

// State representation of the ready state
view.ready = function(model) { 
    model.lastEdited = model.lastEdited || {} ;
    var titleValue = model.lastEdited.title || 'Title' ;
    var descriptionValue = model.lastEdited.description || 'Description' ;
    var id = model.lastEdited.id || '' ;
    var cancelButton = '<button id="cancel" onclick="JavaScript:return actions.cancel({});\">Cancel</button>\n' ;
    var valAttr = "value" ;
    var actionLabel = "Save" ;
    var idElement = ', \'id\':\''+id+'\'' ;
    if (id.length === 0) { cancelButton = '' ; valAttr = "placeholder"; idElement = "" ; actionLabel = "Add"}
    var output = (
            '<br><br><div class="blog-post">\n\
               '+model.posts.map(function(e){
                   return(
                        '<br><br><h3 class="blog-post-title" onclick="JavaScript:return actions.edit({\'title\':\''+e.title+'\', \'description\':\''+e.description+'\', \'id\':\''+e.id+'\'});">'+e.title+'</h3>\n'
                       +'<p class="blog-post-meta">'+e.description+'</p>'
                       +'<button onclick="JavaScript:return actions.delete({\'id\':\''+e.id+'\'});">Delete</button>') ;
                   }).join('\n')+'\n\
             </div>\n\
             <br><br>\n\
             <div class="mdl-cell mdl-cell--6-col">\n\
               <input id="title" type="text" class="form-control"  '+valAttr+'="'+titleValue+'"><br>\n\
               <input id="description" type="textarea" class="form-control" '+valAttr+'="'+descriptionValue+'"><br>\n\
               <button id="save" onclick="JavaScript:return actions.save({\'title\':document.getElementById(\'title\').value, \'description\': document.getElementById(\'description\').value'+idElement+'});">'+actionLabel+'</button>\n\
               '+cancelButton+'\n\
             </div><br><br>\n'
        ) ;
    return output ;
} ;


//display the state representation
view.display = function(representation,next) {
    next(representation) ;
    //var stateRepresentation = document.getElementById("representation");
    //stateRepresentation.innerHTML = representation;
} ;

module.exports = view ;
