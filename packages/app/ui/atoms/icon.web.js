'use client'
//import IconDef from 'app/icons-web';
import dynamic from 'next/dynamic'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
//const IconDef = lazy(() => import('app/icons-web'));

const FormFieldFtf = dynamic(() => import('app/icons-web'));

export const Icon = React.memo(function Icon(props) {
    return <FormFieldFtf {...props}/>
});