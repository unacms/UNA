'use client'
import dynamic from 'next/dynamic'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
//const IconDef = lazy(() => import('app/icons-web'));

const IconWeb = dynamic(() => import('app/icons-web'));

export const Icon = React.memo(function Icon(props) {
    return <IconWeb {...props}/>
});