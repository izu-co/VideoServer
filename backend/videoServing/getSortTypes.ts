import { SortTypes } from '../../interfaces';
import { BackendRequest } from '../../interfaces';

function getSortTypes() : BackendRequest<string[]> {
    const types : string[] = [];
    for (const k of Object.values(SortTypes))
        types.push(k);
    return {
        isOk: true,
        value: types
    };
}

export { getSortTypes };