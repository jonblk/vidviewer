import React from 'react';

type GlobalContextType = {
    rootURL: string 
}

const GlobalContext = React.createContext<GlobalContextType | null>(null);

export default GlobalContext;