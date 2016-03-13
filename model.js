
var model = {
              posts: [
                {
                  id: 1,
                  title: "The SAM Pattern",
                  description: "SAM is a new reactive/functional pattern that simplifies Front-End architectures by clearly separating the business logic from the view and, in particular, strictly decoupling back-end APIs from the Front-End. SAM is technology independent and as such can be used to build Web Apps or Native Apps"
                },
                {
                  id: 2,
                  title: "Why I no longer use MVC Frameworks",
                  description: "The worst part of my job these days is designing APIs for front-end developers. "
                }
              ],
              itemId : 3 
            } ;

model.init = function(render) {
    model.render = render ;
} ;
 
model.present = function(data,next) {
    data = data || {} ;
    
    if (data.deletedItemId !== undefined) {
        var d = -1 ;
        model.posts.forEach(function(el,index) {
            if (el.id !== undefined) {
                if (el.id == data.deletedItemId) {
                    d = index ;       
                }
            }
        });
        if (d>=0) {
            model.lastDeleted = model.posts.splice(d,1)[0] ;
        }
    }
    
    if (data.lastEdited !== undefined) {
        model.lastEdited = data.lastEdited ;
    } else {
        delete model.lastEdited ;
    } 
    
    if (data.item !== undefined) {
        
        if (data.item.id !== "") {
            // has been edited
            model.posts.forEach(function(el,index) {
                if (el.id !== undefined) {
                    if (el.id == data.item.id) {
                        model.posts[index] = data.item ;       
                    }
                }
            });
            
        } else {
            // new item
            data.item.id = model.itemId++ ;
            model.posts.push(data.item) ;
        }
    }
    
    model.render(model,next) ;
} ;

module.exports = model ;