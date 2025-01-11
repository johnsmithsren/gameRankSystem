import * as fs from 'fs'
import * as path from 'path'

export class E_GetAll {
    static File = 1    // 1
    static Dir = 2     // 10
    static FileAndDir = 3  // 11
}
export interface IFileOrDirInfo {
    pathStr: string
    statInfo: fs.Stats
}
export class FileUtil {
    private static SeqRegExp = new RegExp("\\\\", 'g')
    public static UseLinuxSep = true
    public static NeedCovertToLinuxSep = true

    // node a/b/c/d/e.js
    // => a/b/c/d
    public static WorkDir = (() => {
        if (FileUtil.UseLinuxSep) {
            if (process.platform == 'win32') {
                FileUtil.NeedCovertToLinuxSep = true
            }
        }
        let pathName = ""
        if (process.argv[1] != undefined) { // nodejs
            pathName = path.dirname(process.argv[1])
        } else if (process.argv[0] != undefined) {  // electron
            pathName = path.dirname(process.argv[0])
        }
        if (FileUtil.NeedCovertToLinuxSep) {
            pathName = pathName.replace(FileUtil.SeqRegExp, "/")
        }
        return pathName
    })();

    public static tryCreateDir(dirPath: string) {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            return
        }
        fs.mkdirSync(dirPath, {
            recursive: true
        })
    }

    /**
     * 
     * @param dirPath 
     * @returns 表示是否执行了删除操作
     */
    public static tryRemoveDir(dirPath: string): boolean {
        if (FileUtil.isDirExist(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true })
            return true
        }
        return false
    }

    /**
     * 
     * @param filePath 
     */
    public static tryRemoveFile(filePath: string): boolean {
        if (FileUtil.isFileExist(filePath)) {
            fs.rmSync(filePath, { recursive: true, force: true })
            return true
        }
        return false
    }

    public static tryRemoveDirOrFile(dirOfFilePath: string): boolean {
        if (FileUtil.isDirOrFileExist(dirOfFilePath)) {
            fs.rmSync(dirOfFilePath, { recursive: true, force: true })
            return true
        }
        return false
    }

    /**
     * 存在，且是文件，才返回 true
     */
    public static isFileExist(filePath: string): boolean {
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    }

    /**
     * 存在，且是目录，才返回 true
     */
    public static isDirExist(dir: string): boolean {
        return fs.existsSync(dir) && fs.statSync(dir).isDirectory()
    }

    /**
     * 
     * @param {Boolean} dir 
     */
    public static isDirOrFileExist(dirOrFile: string): boolean {
        return fs.existsSync(dirOrFile)
    }

    /**
     * 
     * @param rootDirPath 
     * @param callback 如果返回 false 表示，直接跳过遍历
     * @param depthLimit 
     * @returns 
     */
    public static forEachItem(rootDirPath: string, callback: (item: IFileOrDirInfo) => boolean, depthLimit = 0): IFileOrDirInfo[] {
        if (!FileUtil.isDirExist(rootDirPath)) {
            return []
        }

        let currentDepth = 0
        let dirList = [rootDirPath]
        let nextDirList = []

        do {
            nextDirList = []
            for (let i = 0; i < dirList.length; i++) {
                let currentDir = dirList[i]
                let tempFileOrDirList = fs.readdirSync(currentDir)
                tempFileOrDirList.forEach(function (item) {
                    let newPath = path.join(currentDir, item).replace(FileUtil.SeqRegExp, "/")
                    let itemStat = fs.statSync(newPath)
                    let flag = callback({
                        pathStr: newPath,
                        statInfo: itemStat,
                    })
                    if (!flag) {
                        return
                    }
                    if (itemStat.isDirectory()) {
                        nextDirList.push(newPath)
                    }
                })
            }
            currentDepth++
            if (depthLimit != 0 && currentDepth >= depthLimit) {
                break
            }
            dirList = nextDirList
        } while (nextDirList.length != 0)
    }

    /**
     * 
     * @param rootDirPath 
     * @param depthLimit 0: 表示递归获取。 否则表示递归层数
     * @param currentDepth  默认填 0
     */
    public static getAll(needType: number, rootDirPath: string, depthLimit = 0): IFileOrDirInfo[] {
        let retList: IFileOrDirInfo[] = []
        if (!FileUtil.isDirExist(rootDirPath)) {
            return []
        }

        FileUtil.forEachItem(rootDirPath, (item: IFileOrDirInfo) => {
            if (item.statInfo.isDirectory()) {
                if ((needType & E_GetAll.Dir) != 0) {
                    retList.push(item)
                }
            } else if (item.statInfo.isFile()) {
                if ((needType & E_GetAll.File) != 0) {
                    retList.push(item)
                }
            }
            return true
        }, depthLimit)

        return retList
    }
    /**
     * 
     * @param rootDir 
     * @param depthLimit 0: 表示递归获取。 否则表示递归层数
     * @param currentDepth  默认填 0
     */
    public static getAllFileAndDirectory(rootDir: string, depthLimit = 0): string[] {
        let retList = FileUtil.getAll(E_GetAll.FileAndDir, rootDir, depthLimit).map((item) => {
            return item.pathStr
        })
        return retList
    }

    /**
     * 
     * @param rootDir 
     * @param depthLimit 0: 表示递归获取。 否则表示递归层数
     * @param currentDepth  默认填 0
     */
    public static getAllDirectory(rootDir: string, depthLimit = 0): string[] {
        let retList = FileUtil.getAll(E_GetAll.Dir, rootDir, depthLimit).map((item) => {
            return item.pathStr
        })
        return retList
    }

    /**
     * 
     * @param rootDir 
     * @param depthLimit 0: 表示递归获取。 否则表示递归层数
     * @param currentDepth  默认填 0
     */
    public static getAllFile(rootDir: string, depthLimit = 0): string[] {
        let retList = FileUtil.getAll(E_GetAll.File, rootDir, depthLimit).map((item) => {
            return item.pathStr
        })
        return retList
    }


    /**
     * 判断目录下面是否有文件
     * @param rootDir 
     * @param depthLimit 
     * @param currentDepth 
     */
    public static hasFileInDir(rootDir: string, depthLimit = 0): boolean {
        let retList = FileUtil.getAll(E_GetAll.File, rootDir, depthLimit)
        return retList.length > 0
    }



    /**
     * 
     * @param inWhichPath 不删除这个目录本身
     * @returns 返回被删除的目录列表
     */
    public static removeEmptyDir(inWhichPath: string, fileFilter?: ((filePath: string) => boolean)): string[] {
        let needBeDeleteDirList = []
        let allDirPathList = FileUtil.getAllDirectory(inWhichPath)
        allDirPathList = allDirPathList.sort((a, b) => {
            return b.length - a.length
        })
        for (let dir of allDirPathList) {
            let count = 0
            if (fileFilter == undefined) {
                count = FileUtil.getAllFile(dir).length
            } else {
                count = FileUtil.getAllFile(dir).filter(fileFilter).length
            }
            if (count == 0) {
                FileUtil.tryRemoveDir(dir)
                needBeDeleteDirList.push(dir)
            }
        }
        return needBeDeleteDirList
    }

    // /**
    //  * https://github.com/jprichardson/node-fs-extra/blob/a84ef6dd89/docs/copy-sync.md
    //  * @param 移动文件或者目录
    //  * @returns 返回被删除的目录列表
    //  */
    // public static moveSync(src: string, dest: string, options?: fse.CopyOptionsSync) {
    //     fse.moveSync(src, dest, options)
    // }

    // /**
    //  * https://github.com/jprichardson/node-fs-extra/blob/a84ef6dd89/docs/move-sync.md
    //  * @param 复制文件或目录
    //  * @returns 返回被删除的目录列表
    //  */
    // public static copySync(src: string, dest: string, options?: fse.CopyOptionsSync) {
    //     fse.copySync(src, dest, options)
    // }

    public static getTotalSize(directoryOrFile: string): number {
        if (!FileUtil.isDirOrFileExist(directoryOrFile)) {
            return 0
        }
        let statInfo = fs.statSync(directoryOrFile)
        if (statInfo.isFile()) {
            return statInfo.size
        }

        let totalSize = 0
        const fileInfoList = FileUtil.getAll(E_GetAll.File, directoryOrFile)
        fileInfoList.forEach(function (fileInfo) {
            totalSize += fileInfo.statInfo.size
        })
        return totalSize
    }


    public static toReadableSize(bytes: number): string {
        const sizes = ["B", "KB", "MB", "GB", "TB"]
        if (bytes == 0) {
            return "0"
        }
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        if (i == 0) {
            return bytes + " " + sizes[i]
        }
        return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
    }
}