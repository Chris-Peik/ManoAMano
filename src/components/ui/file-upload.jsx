import * as React from "react"
import { cn } from "@/lib/utils"

const FileUploadContext = React.createContext(null)

function FileUpload({
    children,
    value = [],
    onValueChange,
    maxFiles = 3,
    maxSize = 5 * 1024 * 1024,
    accept = "image/*",
    onFileReject,
    className,
    ...props
}) {
    const inputRef = React.useRef(null)
    const [dragActive, setDragActive] = React.useState(false)

    const handleFiles = (files) => {
        const newFiles = []
        for (const file of files) {
            if (value.length + newFiles.length >= maxFiles) {
                onFileReject?.(file, `Maximum ${maxFiles} files allowed`)
                continue
            }
            if (file.size > maxSize) {
                onFileReject?.(file, `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
                continue
            }
            newFiles.push(file)
        }
        if (newFiles.length > 0) {
            onValueChange([...value, ...newFiles])
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragActive(false)
        if (e.dataTransfer.files) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = () => setDragActive(false)

    const removeFile = (index) => {
        onValueChange(value.filter((_, i) => i !== index))
    }

    const openFilePicker = () => inputRef.current?.click()

    return (
        <FileUploadContext.Provider value={{ value, removeFile, openFilePicker, dragActive, maxFiles, maxSize }}>
            <div
                className={cn("w-full", className)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                {...props}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={maxFiles > 1}
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
                {children}
            </div>
        </FileUploadContext.Provider>
    )
}

function FileUploadDropzone({ children, className }) {
    const ctx = React.useContext(FileUploadContext)
    return (
        <div
            onClick={ctx?.openFilePicker}
            className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                ctx?.dragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                className
            )}
        >
            {children}
        </div>
    )
}

function FileUploadTrigger({ children, asChild, ...props }) {
    const ctx = React.useContext(FileUploadContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: (e) => {
                e.stopPropagation()
                ctx?.openFilePicker()
                children.props.onClick?.(e)
            },
            ...props
        })
    }

    return (
        <button onClick={(e) => { e.stopPropagation(); ctx?.openFilePicker() }} {...props}>
            {children}
        </button>
    )
}

function FileUploadList({ children, className }) {
    return (
        <div className={cn("mt-4 space-y-2", className)}>
            {children}
        </div>
    )
}

function FileUploadItem({ children, value: file, className }) {
    const preview = React.useMemo(() => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file)
        }
        return null
    }, [file])

    React.useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview) }
    }, [preview])

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
            className
        )}>
            <FileUploadItemContext.Provider value={{ file, preview }}>
                {children}
            </FileUploadItemContext.Provider>
        </div>
    )
}

const FileUploadItemContext = React.createContext(null)

function FileUploadItemPreview({ className }) {
    const ctx = React.useContext(FileUploadItemContext)
    if (!ctx?.preview) return null
    return (
        <div className={cn("w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0", className)}>
            <img src={ctx.preview} alt={ctx.file.name} className="w-full h-full object-cover" />
        </div>
    )
}

function FileUploadItemMetadata({ className }) {
    const ctx = React.useContext(FileUploadItemContext)
    if (!ctx) return null
    const sizeInKB = Math.round(ctx.file.size / 1024)
    const displaySize = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`
    return (
        <div className={cn("flex-1 min-w-0", className)}>
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{ctx.file.name}</p>
            <p className="text-xs text-gray-500">{displaySize}</p>
        </div>
    )
}

function FileUploadItemDelete({ children, asChild, index, ...props }) {
    const uploadCtx = React.useContext(FileUploadContext)

    const handleDelete = (e) => {
        e.stopPropagation()
        uploadCtx?.removeFile(index)
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { onClick: handleDelete, ...props })
    }

    return (
        <button onClick={handleDelete} {...props}>
            {children}
        </button>
    )
}

export {
    FileUpload,
    FileUploadDropzone,
    FileUploadTrigger,
    FileUploadList,
    FileUploadItem,
    FileUploadItemPreview,
    FileUploadItemMetadata,
    FileUploadItemDelete
}
