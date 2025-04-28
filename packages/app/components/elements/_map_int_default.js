import React from 'react';
import Form from 'app/components/elements/form';

export const componentsMapDefault = {
    'form': Form,
    'simple_list': React.lazy(() => import('app/components/elements/simple_list')),
    'grid': React.lazy(() => import('app/components/elements/grid')),
    'msg': React.lazy(() => import('app/components/elements/msg')),
    'redirect': React.lazy(() => import('app/components/elements/redirect'))
};