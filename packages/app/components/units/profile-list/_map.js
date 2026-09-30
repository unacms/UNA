import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each profile unit is its own chunk (see lib/dynamic-fallback.js).
const UnitPerson = dynamic(() => import('./bx-persons'), { loading: DynamicFallback });
const UnitGroups = dynamic(() => import('./bx-groups'), { loading: DynamicFallback });
const UnitSpaces = dynamic(() => import('./bx-spaces'), { loading: DynamicFallback });
const UnitDefault = dynamic(() => import('./default'), { loading: DynamicFallback });

export const componentsMapDefault = {
    'bx_persons': UnitPerson,
    'bx_groups': UnitGroups,
    'bx_spaces': UnitSpaces,
    'default': UnitDefault,
};
