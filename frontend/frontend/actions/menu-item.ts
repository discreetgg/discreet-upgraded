import api from '@/lib/axios';

export const deleteMenuItem = async (menuId: string) => {
  try {
    return await api.delete(`/menu/${menuId}`);
    // return response;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getMenuCategories = async (discordId: string) => {
  try {
    return await api.get(`/menu/categories/${discordId}`);
  } catch (error: any) {
    throw new Error(error);
  }
};

export const createMenuCategory = async (payload: {
  owner: string;
  category: string;
}) => {
  try {
    return await api.post('/menu/categories', payload);
  } catch (error: any) {
    throw new Error(error);
  }
};

export const deleteMediaMenuItem = async (mediaId: string) => {
  try {
    return await api.delete(`/menu/media/${mediaId}`);
    // return response;
  } catch (error: any) {
    throw new Error(error);
  }
};
export const updateMenuItem = async (payload: {
  formData: FormData;
  menuId: string;
}) => {
  try {
    return await api.patch(`/menu/${payload.menuId}`, payload.formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // return response;
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'update failed',
        status: error.response.status,
        data: error.response.data,
      };
    }
    if (error.request) {
      throw { message: 'No response from server', status: null };
    }
    throw { message: error.message || 'Unexpected error', status: null };
  }
};
export const createMenuItem = async (payload: { formData: FormData }) => {
  try {
    return await api.post('/menu', payload.formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // return response;
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Create menu failed',
        status: error.response.status,
        data: error.response.data,
      };
    }
    if (error.request) {
      throw { message: 'No response from server', status: null };
    }
    throw { message: error.message || 'Unexpected error', status: null };
  }
};

export const getMenuItems = async (discordId: string) => {
  if (!discordId) return [] as unknown as MenuItemType[];
  try {
    const response = await api.get(`/menu/${discordId}`);
    return response.data as unknown as MenuItemType[];
  } catch (error: any) {
    return [] as unknown as MenuItemType[];
  }
};
export const buyMenuItem = async (payload: BuyMenuItemPayload) => {
  try {
    const response = await api.post('/payment/buy-menu', payload);
    console.log('MENU ITEM RESPONSE', response.data);
    return response.data;
  } catch (error) {
    console.log('ERROR:Unable to buy-menu to plan', error);
    throw error;
  }
};
