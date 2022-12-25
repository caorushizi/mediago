const getFavList = async (): Promise<any[]> => {
  return await window.electron.getCollectionList();
};
const getVideoList = async (): Promise<any[]> => {
  return await window.electron.getVideoList();
};

export { getFavList, getVideoList };
