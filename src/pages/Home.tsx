import React, { useState, useCallback, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { Keyboard, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/mousewheel';
import { useTranslation } from 'react-i18next';
import AddProductForm from '../forms/AddProductForm';
import ProductList from '../components/Products/ProductList';
import ProfileButton from '../components/common/ProfileButton';
import { useProductList } from '../hooks/useProductList';
import ShoppingList from '../components/ShoppingList/ShoppingList';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { loadProducts, products } = useProductList();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<'inventory' | 'shopping'>('inventory');
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (selectedSegment === 'inventory') {
      loadProducts();
    }
  }, [selectedSegment, loadProducts]);

  const handleSlideChange = () => {
    if (swiper) {
      setSelectedSegment(swiper.activeIndex === 0 ? 'inventory' : 'shopping');
    }
  };

  const handleSegmentChange = (e: CustomEvent) => {
    const newValue = e.detail.value as 'inventory' | 'shopping';
    setSelectedSegment(newValue);
    if (swiper) {
      swiper.slideTo(newValue === 'inventory' ? 0 : 1);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await loadProducts();
      event.detail.complete();
    } catch (error) {
      console.error('Error refreshing:', error);
      event.detail.complete();
    }
  };

  const handleProductAdded = useCallback(async () => {
    try {
      await loadProducts();
      // Forzar la actualización del ProductList
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating products:', error);
    }
  }, [loadProducts]);

  return (
    <IonPage>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">{t('app.title')}</IonTitle>
          <IonButtons slot="end">
            <ProfileButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent 
        fullscreen 
        scrollEvents={true}
        onIonScroll={(e) => {
          const scrollTop = e.detail.scrollTop;
          const segmentContainer = document.querySelector('.segment-control-container');
          
          if (segmentContainer) {
            if (scrollTop > 50) {
              requestAnimationFrame(() => {
                segmentContainer.classList.add('segment-hidden');
              });
            } else {
              requestAnimationFrame(() => {
                segmentContainer.classList.remove('segment-hidden');
              });
            }
          }
        }}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="page-content">
          <div className="segment-control-container">
            <IonSegment 
              value={selectedSegment} 
              onIonChange={handleSegmentChange}
              className="segment-control"
            >
              <IonSegmentButton value="inventory">
                <IonLabel>{t('app.inventory')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="shopping">
                <IonLabel>{t('app.shoppingList')}</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          <Swiper
            modules={[Keyboard, Mousewheel]}
            onSwiper={setSwiper}
            onSlideChange={handleSlideChange}
            initialSlide={0}
            speed={300}
            style={{ width: '100%', height: 'calc(100% - 48px)' }}
            allowTouchMove={true}
            touchStartPreventDefault={false}
            resistance={true}
            resistanceRatio={0.85}
            threshold={5}
            touchRatio={1}
            touchAngle={45}
            longSwipes={true}
            longSwipesRatio={0.5}
            followFinger={true}
            keyboard={{ enabled: true }}
            mousewheel={true}
          >
            <SwiperSlide>
              <div className="slide-content">
                <AddProductForm onProductAdded={handleProductAdded} />
                <ProductList 
                  key={updateTrigger}
                  onRefreshNeeded={loadProducts}
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="slide-content">
                <ShoppingList onRefreshNeeded={loadProducts} />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
