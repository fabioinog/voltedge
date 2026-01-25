# Contexts

React Context providers for global app state.

## LanguageContext

Provides language state (English/Arabic) and translation function throughout the app.

### Usage

```javascript
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t, language, toggleLanguage } = useLanguage();
  
  return (
    <Text>{t('hello')}</Text>
  );
};
```
