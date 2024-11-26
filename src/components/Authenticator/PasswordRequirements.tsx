import React from 'react';
import { IonIcon, IonNote } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

export interface PasswordRequirement {
    text: string;
    check: (password: string) => boolean;
    met: boolean;
}

interface PasswordRequirementsProps {
    requirements: PasswordRequirement[];
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ requirements }) => {
    return (
        <div className="password-requirements">
            <IonNote>Password Requirements</IonNote>
            {requirements.map((req, index) => (
                <div key={index} className="requirement-item">
                    <IonIcon 
                        icon={req.met ? checkmarkCircle : closeCircle} 
                        color={req.met ? 'success' : 'medium'}
                        style={{ marginRight: '8px' }}
                    />
                    <span style={{ 
                        color: req.met ? 'var(--ion-color-success)' : 'var(--ion-color-medium)'
                    }}>
                        {req.text}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default PasswordRequirements;
