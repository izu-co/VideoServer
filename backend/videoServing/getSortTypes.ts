import { SortTypes } from '../../interfaces';
import { SortTypeResponse } from '../../interfaces';

function getSortTypes() : SortTypeResponse {
    const types : string[] = [];
    for (const k of Object.values(SortTypes))
        types.push(k);
    return {
        status: true,
        data: types
    };
}

export { getSortTypes };