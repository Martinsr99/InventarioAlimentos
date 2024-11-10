import React, { useState } from 'react';
import { addProduct } from '../services/InventoryService';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonGrid,
    IonRow,
    IonCol
} from '@ionic/react';

const AddProductForm: React.FC = () => {
    const [name, setName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [location, setLocation] = useState('fridge');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !expiryDate) return;

        await addProduct({
            name,
            expiryDate: new Date(expiryDate),
            location
        });

        setName('');
        setExpiryDate('');
        setLocation('fridge');
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <IonGrid>
            <IonRow>
                <IonCol size="12" sizeMd="6" offsetMd="3">
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Add New Product</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <form onSubmit={handleSubmit}>
                                <IonItem className="ion-margin-bottom">
                                    <IonLabel position="stacked">Product Name</IonLabel>
                                    <IonInput
                                        className="ion-margin-top"
                                        value={name}
                                        onIonChange={e => setName(e.detail.value!)}
                                        placeholder="Enter product name"
                                        required
                                    />
                                </IonItem>

                                <IonItem className="ion-margin-bottom">
                                    <IonLabel position="stacked">Expiry Date</IonLabel>
                                    <IonInput
                                        className="ion-margin-top"
                                        type="date"
                                        value={expiryDate}
                                        onIonChange={e => setExpiryDate(e.detail.value!)}
                                        min={today}
                                        max="2030-12-31"
                                        required
                                    />
                                </IonItem>

                                <IonItem className="ion-margin-bottom">
                                    <IonLabel position="stacked">Location</IonLabel>
                                    <IonSelect
                                        className="ion-margin-top"
                                        value={location}
                                        onIonChange={e => setLocation(e.detail.value)}
                                        placeholder="Select location"
                                    >
                                        <IonSelectOption value="fridge">Fridge</IonSelectOption>
                                        <IonSelectOption value="freezer">Freezer</IonSelectOption>
                                    </IonSelect>
                                </IonItem>

                                <IonButton
                                    expand="block"
                                    type="submit"
                                    className="ion-margin-top"
                                >
                                    Add Product
                                </IonButton>
                            </form>
                        </IonCardContent>
                    </IonCard>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

export default AddProductForm;
