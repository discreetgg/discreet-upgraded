import { createContext, useContext } from 'react';

type FormSubmitContextType = {
  submit?: () => void;
};

export const FormSubmitContext = createContext<FormSubmitContextType>({});

export const useFormSubmit = () => useContext(FormSubmitContext);
