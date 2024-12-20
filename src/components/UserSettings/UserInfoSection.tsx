import React from 'react';
import { EmailSection } from './EmailSection';
import { LanguageSection } from './LanguageSection';
import AutoDeleteSection from './AutoDeleteSection';

interface UserInfoSectionProps {
  email: string | null | undefined;
  onToggleLanguage: () => void;
}

export const UserInfoSection: React.FC<UserInfoSectionProps> = ({
  email,
  onToggleLanguage
}) => {
  return (
    <div className="user-info-section">
      <div className="user-info-group">
        <EmailSection email={email} />
        <LanguageSection onToggleLanguage={onToggleLanguage} />
        <AutoDeleteSection />
      </div>
    </div>
  );
};
