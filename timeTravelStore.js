// From Gunar Gessner 
// https://github.com/sam-js/timetravel
//
let snapshots = {}
snapshots.data = []
snapshots.model = [] 

const listeners = []

export const subscribe = listener => {
  listeners.push(listener)
  listener(snapshots)

  return function unsubscribe() {
    const index = listeners.indexOf(listener)
    listeners.splice(index, 1)
  }
}
const publish = _ => listeners.forEach(listener => listener(snapshots))

export const getListOfSnapshots = _ => snapshots

export const getSnapshot = index => {
    snapshots.data = snapshots.data.slice(0, (index+1))
    snapshots.model = snapshots.model.slice(0, (index+1))
    publish()
    return { ...snapshots.model[index] }
}


export const saveSnapshot = (dataset, model) => {

    if (dataset) {
        snapshots.data.push({ ...dataset })
    }
    if (model) {
        snapshots.model.push({ ...model })
    }
  
    console.log('Saved snapshots:', snapshots)

    // Publish to subscribers
    publish()
}