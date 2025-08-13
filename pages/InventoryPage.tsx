
import React, { useState, useMemo, FC } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { mockInventory as initialInventory } from '../data/mockInventoryData';
import { InventoryItem } from '../types';
import { SearchIcon, PlusCircleIcon, EditIcon, TrashIcon, FileTextIcon, ClipboardPlusIcon } from '../components/icons';
import Select from '../components/ui/Select';

const InventoryPage: FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<InventoryItem['type'] | 'All'>('All');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'add' | 'edit' | 'log' | 'delete' | null>(null);
    const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);

    const openModal = (type: 'add' | 'edit' | 'log' | 'delete', item?: InventoryItem) => {
        setModalType(type);
        setCurrentItem(item || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType(null);
        setCurrentItem(null);
    };

    const handleSaveItem = (itemToSave: InventoryItem) => {
        if (modalType === 'add') {
            setInventory([...inventory, { ...itemToSave, id: `inv-${Date.now()}`, lastUpdated: new Date().toISOString().split('T')[0] }]);
        } else if (modalType === 'edit') {
            setInventory(inventory.map(item => item.id === itemToSave.id ? { ...itemToSave, lastUpdated: new Date().toISOString().split('T')[0] } : item));
        }
        closeModal();
    };
    
    const handleLogUse = (id: string, amount: number) => {
        setInventory(inventory.map(item => {
            if (item.id === id) {
                const newValue = Math.max(0, item.quantity.value - amount);
                return { ...item, quantity: { ...item.quantity, value: newValue }, lastUpdated: new Date().toISOString().split('T')[0] };
            }
            return item;
        }));
        closeModal();
    };
    
    const handleDelete = (id: string) => {
        setInventory(inventory.filter(item => item.id !== id));
        closeModal();
    }

    const filteredInventory = useMemo(() => {
        return inventory.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.catalogNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (typeFilter === 'All' || item.type === typeFilter)
        );
    }, [searchTerm, typeFilter, inventory]);

    const itemTypes: (InventoryItem['type'] | 'All')[] = ['All', 'Reagent', 'Antibody', 'Plasmid', 'Consumable', 'Sample'];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Lab Inventory</h1>
                    <p className="mt-1 text-md text-slate-600">Search and manage lab supplies, reagents, and samples.</p>
                </div>
                <Button onClick={() => openModal('add')}>
                    <PlusCircleIcon className="mr-2 h-5 w-5"/>
                    New Item
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by name, catalog #, or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                             {itemTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        typeFilter === type
                                            ? 'bg-slate-800 text-white'
                                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredInventory.length > 0 ? filteredInventory.map(item => {
                            const isExpired = new Date(item.expirationDate) < new Date();
                            const isLowStock = item.lowStockThreshold !== undefined && item.quantity.value < item.lowStockThreshold;
                            const rowClass = isExpired ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : 'hover:bg-slate-50';

                            return (
                            <tr key={item.id} className={rowClass}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.location}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    <div>{item.supplier} / {item.catalogNumber}</div>
                                    <div className="text-xs">Lot: {item.lotNumber}</div>
                                    <div className="text-xs">Expires: {item.expirationDate}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold">{item.quantity.value} {item.quantity.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isExpired ? 'bg-red-200 text-red-800' : isLowStock ? 'bg-yellow-200 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                         {isExpired ? 'Expired' : isLowStock ? 'Low Stock' : 'In Stock'}
                                     </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openModal('log', item)} title="Log Use"><ClipboardPlusIcon className="h-5 w-5"/></Button>
                                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', item)} title="Edit"><EditIcon className="h-5 w-5"/></Button>
                                        {item.sdsUrl && <a href={item.sdsUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-slate-200" title="View SDS"><FileTextIcon className="h-5 w-5 text-slate-600"/></a>}
                                        <Button variant="ghost" size="sm" onClick={() => openModal('delete', item)} title="Delete"><TrashIcon className="h-5 w-5 text-red-500"/></Button>
                                    </div>
                                </td>
                            </tr>
                        )}) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-500">No inventory items found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    {modalType === 'add' && <ItemForm onSave={handleSaveItem} onCancel={closeModal} />}
                    {modalType === 'edit' && <ItemForm itemToEdit={currentItem} onSave={handleSaveItem} onCancel={closeModal} />}
                    {modalType === 'log' && currentItem && <LogUseForm item={currentItem} onLog={handleLogUse} onCancel={closeModal} />}
                    {modalType === 'delete' && currentItem && <ConfirmDeleteDialog item={currentItem} onDelete={handleDelete} onCancel={closeModal} />}
                </Modal>
            )}
        </div>
    );
};

const Modal: FC<{onClose: () => void, children: React.ReactNode}> = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const ItemForm: FC<{itemToEdit?: InventoryItem | null, onSave: (item: InventoryItem) => void, onCancel: () => void}> = ({ itemToEdit, onSave, onCancel }) => {
    const [item, setItem] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'>>(() => itemToEdit || {
        name: '', type: 'Reagent', supplier: '', catalogNumber: '', location: '',
        quantity: { value: 0, unit: '' }, lotNumber: '', expirationDate: '', lowStockThreshold: 10, sdsUrl: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'quantityValue' || name === 'quantityUnit') {
            const field = name === 'quantityValue' ? 'value' : 'unit';
            const val = name === 'quantityValue' ? parseFloat(value) : value;
            setItem(prev => ({ ...prev, quantity: { ...prev.quantity, [field]: val }}));
        } else {
            setItem(prev => ({...prev, [name]: value}));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...item, id: itemToEdit?.id || '', lastUpdated: itemToEdit?.lastUpdated || '' } as InventoryItem);
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle>{itemToEdit ? 'Edit' : 'Add'} Inventory Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="name" value={item.name} onChange={handleChange} placeholder="Item Name" required/>
                     <Select name="type" value={item.type} onChange={handleChange}>
                        <option value="Reagent">Reagent</option>
                        <option value="Antibody">Antibody</option>
                        <option value="Plasmid">Plasmid</option>
                        <option value="Consumable">Consumable</option>
                        <option value="Sample">Sample</option>
                     </Select>
                 </div>
                 <Input name="location" value={item.location} onChange={handleChange} placeholder="Storage Location" required/>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input name="supplier" value={item.supplier} onChange={handleChange} placeholder="Supplier"/>
                     <Input name="catalogNumber" value={item.catalogNumber} onChange={handleChange} placeholder="Catalog #"/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input name="lotNumber" value={item.lotNumber} onChange={handleChange} placeholder="Lot #"/>
                     <Input name="expirationDate" type="date" value={item.expirationDate} onChange={handleChange} required/>
                 </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Input name="quantityValue" type="number" value={item.quantity.value} onChange={handleChange} placeholder="Quantity" step="any" required/>
                     <Input name="quantityUnit" value={item.quantity.unit} onChange={handleChange} placeholder="Unit (e.g., mL, mg)" required/>
                     <Input name="lowStockThreshold" type="number" value={item.lowStockThreshold} onChange={handleChange} placeholder="Low Stock Threshold"/>
                 </div>
                 <Input name="sdsUrl" value={item.sdsUrl} onChange={handleChange} placeholder="SDS URL (optional)"/>
            </CardContent>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

const LogUseForm: FC<{item: InventoryItem, onLog: (id: string, amount: number) => void, onCancel: () => void}> = ({ item, onLog, onCancel }) => {
    const [amount, setAmount] = useState(0);
    return (
        <div>
            <CardHeader>
                <CardTitle>Log Use for: {item.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
                <p>Current Quantity: <span className="font-bold">{item.quantity.value} {item.quantity.unit}</span></p>
                <div>
                    <label htmlFor="log-amount" className="block text-sm font-medium text-slate-700">Amount Used ({item.quantity.unit})</label>
                    <Input id="log-amount" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} min="0" step="any" max={item.quantity.value} className="mt-1"/>
                </div>
            </CardContent>
             <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onLog(item.id, amount)} disabled={amount <= 0}>Log</Button>
            </div>
        </div>
    );
};

const ConfirmDeleteDialog: FC<{item: InventoryItem, onDelete: (id: string) => void, onCancel: () => void}> = ({ item, onDelete, onCancel }) => (
     <div>
        <CardHeader>
            <CardTitle>Delete Item?</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
            <p>Are you sure you want to permanently delete <span className="font-bold">{item.name}</span> from the inventory?</p>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
        </CardContent>
        <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => onDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white">Confirm Delete</Button>
        </div>
    </div>
);


export default InventoryPage;
