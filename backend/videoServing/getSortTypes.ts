import { BasicAnswer, SortTypes } from "../util";


function getSortTypes() : BasicAnswer {
    let types = []
    for (let k of Object.values(SortTypes))
        types.push(k)
    return {
        status: true,
        data: types
    }
}

export { getSortTypes }