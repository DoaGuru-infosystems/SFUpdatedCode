import { useEffect, useState } from 'react';



function EditModal({ show, onClose, onSubmit, item, type }) {
  console.log(item);
  // temp = item;
  const [formData, setFormData] = useState({...item});

  console.log(formData);

  useEffect(() => {
    setFormData({...item});
  }, [item]);
  

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow-lg">
        <h2 className="text-xl mb-4">Edit {type}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-sm font-medium">Update {type}</label>
            <input
              type="text"
              name="name"
              value={formData?.name || ''}
              onChange={handleChange}
              className="border rounded p-1 w-full"
              required
            />
          </div>
          {type === 'projects' && (
            <div className="mb-2 mt-4">
              <label className="block text-sm font-medium mb-2">Update Departments</label>
              <div className="flex flex-wrap gap-2">
                {["Development", "Digital Marketing", "SEO", "Management", "Sales"].map(dept => {
                  const currentDepts = formData?.department ? formData.department.split(',').map(d => d.trim().toLowerCase()) : [];
                  const isChecked = currentDepts.includes(dept.toLowerCase());
                  
                  return (
                    <label key={dept} className="flex items-center gap-1.5 text-xs bg-gray-50 px-2 py-1 rounded border cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let newDepts;
                          if (e.target.checked) {
                            newDepts = [...currentDepts, dept.toLowerCase()];
                          } else {
                            newDepts = currentDepts.filter(d => d !== dept.toLowerCase());
                          }
                          handleChange({ target: { name: 'department', value: newDepts.join(', ') } });
                        }}
                        className="accent-blue-500"
                      />
                      {dept}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-3 py-1 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;
