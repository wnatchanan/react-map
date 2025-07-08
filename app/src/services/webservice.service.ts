
import { http } from "../http-common";
// import shp from "shpjs";
// import Papa from 'papaparse';

const loadGeojsonFile = async (file_path: any) => {
    return http.get(file_path);
};

// const loadShapeFile = async (file_path: any) => {
//     return await shp(file_path);
// };

// const loadCSVFile = async (file_path: string) => {
//     return new Promise<any[]>((resolve, reject) => {
//         Papa.parse(file_path, {
//             header: true,
//             download: true, // IMPORTANT if you load via URL
//             complete: (result) => {
//                 resolve(result.data);
//             },
//             error: (err) => {
//                 reject(err);
//             }
//         });
//     });
// };


const loadAPI = async (path: string) => {
    return http.get(path)
};


const webservice = {
    loadGeojsonFile,
    // loadShapeFile,
    // loadCSVFile,
    loadAPI
};

export default webservice;