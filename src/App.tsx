import React from 'react';
import Auth from './components/Authenticator/Auth';

const App: React.FC = () => {
    return (
        <div>
            <h1>Inventario de Alimentos</h1>
            <Auth />
        </div>
    );
};

export default App;
