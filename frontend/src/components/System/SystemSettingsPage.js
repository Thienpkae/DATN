import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Grid,
    TextField,
    Button,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Box,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    Palette as PaletteIcon,
    Notifications as NotificationsIcon,
    AccountTree as BlockchainIcon,
    Public as GeneralIcon,
    Save as SaveIcon,
    Restore as RestoreIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Edit as EditIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import api from '../../services/api';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`system-tabpanel-${index}`}
            aria-labelledby={`system-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const SystemSettingsPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [configs, setConfigs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [editDialog, setEditDialog] = useState({ open: false, config: null, isNew: false });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, config: null });

    // Category icons mapping
    const categoryIcons = {
        security: <SecurityIcon />,
        performance: <SpeedIcon />,
        ui: <PaletteIcon />,
        notification: <NotificationsIcon />,
        blockchain: <BlockchainIcon />,
        general: <GeneralIcon />
    };

    useEffect(() => {
        loadCategories();
        loadConfigs();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await api.get('/system/configs/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadConfigs = async (category = null) => {
        try {
            setLoading(true);
            const params = category ? { category } : {};
            const response = await api.get('/system/configs', { params });
            if (response.data.success) {
                setConfigs(response.data.data);
            }
        } catch (error) {
            console.error('Error loading configs:', error);
            setMessage({ type: 'error', content: 'Lỗi khi tải cấu hình hệ thống' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        if (newValue === 0) {
            loadConfigs(); // Load all configs
        } else {
            const category = categories[newValue - 1]?.key;
            loadConfigs(category);
        }
    };

    const handleSaveConfig = async (configData) => {
        try {
            setLoading(true);
            const response = await api.put(`/system/configs/${configData.key}`, configData);
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message });
                loadConfigs();
                setEditDialog({ open: false, config: null, isNew: false });
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi lưu cấu hình' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfig = async (key) => {
        try {
            setLoading(true);
            const response = await api.delete(`/system/configs/${key}`);
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message });
                loadConfigs();
                setDeleteDialog({ open: false, config: null });
            }
        } catch (error) {
            console.error('Error deleting config:', error);
            setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi xóa cấu hình' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetConfig = async (key) => {
        try {
            setLoading(true);
            const response = await api.post(`/system/configs/${key}/reset`);
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message });
                loadConfigs();
            }
        } catch (error) {
            console.error('Error resetting config:', error);
            setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi reset cấu hình' });
        } finally {
            setLoading(false);
        }
    };

    const handleInitializeConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.post('/system/configs/initialize');
            if (response.data.success) {
                setMessage({ type: 'success', content: response.data.message });
                loadConfigs();
            }
        } catch (error) {
            console.error('Error initializing configs:', error);
            setMessage({ type: 'error', content: error.response?.data?.message || 'Lỗi khi khởi tạo cấu hình' });
        } finally {
            setLoading(false);
        }
    };

    const renderConfigValue = (config) => {
        const { value, dataType } = config;
        
        switch (dataType) {
            case 'boolean':
                return (
                    <Chip
                        label={value ? 'Bật' : 'Tắt'}
                        color={value ? 'success' : 'default'}
                        size="small"
                    />
                );
            case 'number':
                return <Typography variant="body2">{value.toLocaleString()}</Typography>;
            case 'object':
            case 'array':
                return <Typography variant="body2">{JSON.stringify(value)}</Typography>;
            default:
                return <Typography variant="body2">{value}</Typography>;
        }
    };

    const renderConfigsTable = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Khóa cấu hình</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell>Giá trị</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Danh mục</TableCell>
                        <TableCell>Công khai</TableCell>
                        <TableCell>Thao tác</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {configs.map((config) => (
                        <TableRow key={config.key}>
                            <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                    {config.key}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {config.description}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {renderConfigValue(config)}
                            </TableCell>
                            <TableCell>
                                <Chip label={config.dataType} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {categoryIcons[config.category]}
                                    <Typography variant="body2">
                                        {categories.find(c => c.key === config.category)?.name || config.category}
                                    </Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={config.isPublic ? 'Có' : 'Không'}
                                    color={config.isPublic ? 'primary' : 'default'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <Box display="flex" gap={1}>
                                    <Tooltip title="Chỉnh sửa">
                                        <IconButton
                                            size="small"
                                            onClick={() => setEditDialog({ open: true, config, isNew: false })}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reset về mặc định">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleResetConfig(config.key)}
                                        >
                                            <RestoreIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => setDeleteDialog({ open: true, config })}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom display="flex" alignItems="center" gap={2}>
                <SettingsIcon />
                Cài đặt hệ thống
            </Typography>

            {message.content && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', content: '' })}>
                    {message.content}
                </Alert>
            )}

            <Card>
                <CardHeader
                    title="Quản lý cấu hình hệ thống"
                    subheader="UC-67: Cài đặt hệ thống - Quản lý cấu hình và tùy chỉnh hoạt động"
                    action={
                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setEditDialog({ open: true, config: null, isNew: true })}
                            >
                                Thêm cấu hình
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={handleInitializeConfigs}
                                disabled={loading}
                            >
                                Khởi tạo mặc định
                            </Button>
                        </Box>
                    }
                />
                <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Tất cả" />
                            {categories.map((category, index) => (
                                <Tab
                                    key={category.key}
                                    label={category.name}
                                    icon={categoryIcons[category.key]}
                                    iconPosition="start"
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        {renderConfigsTable()}
                    </TabPanel>

                    {categories.map((category, index) => (
                        <TabPanel key={category.key} value={tabValue} index={index + 1}>
                            <Typography variant="h6" gutterBottom>
                                {category.description}
                            </Typography>
                            {renderConfigsTable()}
                        </TabPanel>
                    ))}
                </CardContent>
            </Card>

            {/* Edit Config Dialog */}
            <ConfigEditDialog
                open={editDialog.open}
                config={editDialog.config}
                isNew={editDialog.isNew}
                categories={categories}
                onClose={() => setEditDialog({ open: false, config: null, isNew: false })}
                onSave={handleSaveConfig}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, config: null })}>
                <DialogTitle>Xác nhận xóa cấu hình</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa cấu hình "{deleteDialog.config?.key}"?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Hành động này không thể hoàn tác.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, config: null })}>
                        Hủy
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleDeleteConfig(deleteDialog.config?.key)}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Config Edit Dialog Component
const ConfigEditDialog = ({ open, config, isNew, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        category: 'general',
        description: '',
        dataType: 'string',
        isPublic: false
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (isNew) {
                setFormData({
                    key: '',
                    value: '',
                    category: 'general',
                    description: '',
                    dataType: 'string',
                    isPublic: false
                });
            } else if (config) {
                setFormData({
                    key: config.key,
                    value: config.value,
                    category: config.category,
                    description: config.description,
                    dataType: config.dataType,
                    isPublic: config.isPublic
                });
            }
            setErrors({});
        }
    }, [open, config, isNew]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.key.trim()) {
            newErrors.key = 'Khóa cấu hình là bắt buộc';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        }

        if (formData.value === '' || formData.value === null || formData.value === undefined) {
            newErrors.value = 'Giá trị là bắt buộc';
        }

        // Validate value based on data type
        if (formData.dataType === 'number' && isNaN(Number(formData.value))) {
            newErrors.value = 'Giá trị phải là số';
        }

        if (formData.dataType === 'boolean' && typeof formData.value !== 'boolean') {
            newErrors.value = 'Giá trị phải là true/false';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            let processedValue = formData.value;

            // Process value based on data type
            if (formData.dataType === 'number') {
                processedValue = Number(formData.value);
            } else if (formData.dataType === 'boolean') {
                processedValue = Boolean(formData.value);
            } else if (formData.dataType === 'object' || formData.dataType === 'array') {
                try {
                    processedValue = JSON.parse(formData.value);
                } catch (error) {
                    setErrors({ value: 'Giá trị JSON không hợp lệ' });
                    return;
                }
            }

            onSave({
                ...formData,
                value: processedValue
            });
        }
    };

    const renderValueInput = () => {
        switch (formData.dataType) {
            case 'boolean':
                return (
                    <FormControl fullWidth margin="normal">
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography>Giá trị:</Typography>
                            <Switch
                                checked={Boolean(formData.value)}
                                onChange={(e) => handleChange('value', e.target.checked)}
                            />
                            <Typography>{formData.value ? 'Bật' : 'Tắt'}</Typography>
                        </Box>
                    </FormControl>
                );
            case 'number':
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Giá trị"
                        type="number"
                        value={formData.value}
                        onChange={(e) => handleChange('value', e.target.value)}
                        error={!!errors.value}
                        helperText={errors.value}
                        required
                    />
                );
            case 'object':
            case 'array':
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Giá trị (JSON)"
                        multiline
                        rows={4}
                        value={typeof formData.value === 'object' ? JSON.stringify(formData.value, null, 2) : formData.value}
                        onChange={(e) => handleChange('value', e.target.value)}
                        error={!!errors.value}
                        helperText={errors.value || 'Nhập giá trị dưới dạng JSON'}
                        required
                    />
                );
            default:
                return (
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Giá trị"
                        value={formData.value}
                        onChange={(e) => handleChange('value', e.target.value)}
                        error={!!errors.value}
                        helperText={errors.value}
                        required
                    />
                );
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isNew ? 'Thêm cấu hình mới' : 'Chỉnh sửa cấu hình'}
            </DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Khóa cấu hình"
                    value={formData.key}
                    onChange={(e) => handleChange('key', e.target.value)}
                    error={!!errors.key}
                    helperText={errors.key}
                    disabled={!isNew}
                    required
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Mô tả"
                    multiline
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                />

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Danh mục</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                label="Danh mục"
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category.key} value={category.key}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Kiểu dữ liệu</InputLabel>
                            <Select
                                value={formData.dataType}
                                onChange={(e) => handleChange('dataType', e.target.value)}
                                label="Kiểu dữ liệu"
                            >
                                <MenuItem value="string">Chuỗi</MenuItem>
                                <MenuItem value="number">Số</MenuItem>
                                <MenuItem value="boolean">Logic</MenuItem>
                                <MenuItem value="object">Đối tượng</MenuItem>
                                <MenuItem value="array">Mảng</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {renderValueInput()}

                <FormControl fullWidth margin="normal">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography>Công khai:</Typography>
                        <Switch
                            checked={formData.isPublic}
                            onChange={(e) => handleChange('isPublic', e.target.checked)}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {formData.isPublic ? 'Người dùng thường có thể xem' : 'Chỉ admin có thể xem'}
                        </Typography>
                    </Box>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>
                    {isNew ? 'Tạo' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SystemSettingsPage;
