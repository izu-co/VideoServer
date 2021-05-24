import { SortTypes } from '../../interfaces';
import { BasicAnswer } from '../../interfaces'

function getSortTypes() : BasicAnswer {
    const types = [];
    for (const k of Object.values(SortTypes))
        types.push(k);
    return {
        status: true,
        data: types
    };
}

export { getSortTypes };