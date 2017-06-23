/**
 * Created by cesar on 14/6/17.
 */

import {_} from 'lodash'



const removeChildKey = function (o) {
    /** remove unnecessary key in fields like {fields: { 'a.b':1 'a':1}} a.b is unnecessary because all a is published (and give error in mogo)
     *
     * remove path with array index like 'a.0.b'
     *
     */

    let a = Object.keys(o)
    for (const key1 of a) {
        let paths = key1.split('.')
        let change=false
        for (const i in paths) {
            if (paths[i].match(/^\d{1,3}$/)) {
                paths.splice(i, 1)
                change=true
            }
        }
        if (change){
            paths=paths.join('.')
            delete o[key1]
            o[paths]=true
        }

    }
    a = Object.keys(o)
    for (const key1 of a) {
        for (const key2 of a) {
            if (key1 !== key2 && (key1).indexOf(key2 + ".") == 0) {
                delete o[key1]
            }
        }
    }
    return o
}


export const getFields=function(columns,extraFields){


    let fields = _.map(columns, 'key')
    fields = fields.concat(extraFields)
    let projection = {}
    for (const path of fields) {
        projection[path] = true
    }
    projection = removeChildKey(projection)
    return projection

}


