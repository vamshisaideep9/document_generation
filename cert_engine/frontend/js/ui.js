export function renderSidebar(schema, onSelectCallback) {
    const container = document.getElementById('module-container');
    container.innerHTML = '';

    for (const [moduleName, documents] of Object.entries(schema)) {
        const moduleBlock = document.createElement('div');
        moduleBlock.innerHTML = `<h3 class="uppercase text-xs text-slate-400 font-extrabold mb-2 tracking-widest">${moduleName}</h3>`;
        
        for (const [docKey, docData] of Object.entries(documents)) {
            const btn = document.createElement('button');
            btn.className = "w-full text-left py-2 px-3 rounded mb-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors text-sm capitalize text-slate-200";
            btn.innerText = docKey.replace(/_/g, ' ');
            btn.onclick = () => {
                document.querySelectorAll('#module-container button').forEach(b => b.classList.remove('bg-blue-600', 'hover:bg-blue-600', 'border-blue-500'));
                btn.classList.add('bg-blue-600', 'hover:bg-blue-600', 'border-blue-500');
                onSelectCallback(docKey, docData);
            };
            moduleBlock.appendChild(btn);
        }
        container.appendChild(moduleBlock);
    }
}

export function renderForm(docName, docData) {
    document.getElementById('form-title').innerText = `Generate: ${docName.replace(/_/g, ' ')}`;
    document.getElementById('dynamic-form').classList.remove('hidden');
    
    document.getElementById('template_name').value = docData.template_file;

    const labelMap = {
        "name": "Full Name",
        "month_year": "Salary Month & Year",
        "join_date": "Date of Joining",
        "bank_acc_no": "Bank Account Number",
        "ifsc_code": "IFSC Code",
        "pan_no": "PAN Number",
        "lop": "Loss of Pay (Days)",
        "basic_full": "Basic (Fixed)",
        "basic_actual": "Basic (Actual)",
        "hra_full": "HRA (Fixed)",
        "hra_actual": "HRA (Actual)",
        "conv_full": "Conveyance (Fixed)",
        "conv_actual": "Conveyance (Actual)",
        "med_full": "Medical Allowance (Fixed)",
        "med_actual": "Medical Allowance (Actual)",
        "bonus_full": "Bonus (Fixed)",
        "bonus_actual": "Bonus (Actual)",
        "spec_full": "Special Allowance (Fixed)",
        "spec_actual": "Special Allowance (Actual)",
        "total_full": "Total Earnings (Fixed)",
        "total_actual": "Total Earnings (Actual)",
        "net_total": "Net Salary Payable",
        "tools_technologies": "Tools & Technologies"
    };



    const fieldsContainer = document.getElementById('form-fields');
    fieldsContainer.innerHTML = '';

    docData.required_fields.forEach(field => {
        const wrapper = document.createElement('div');
        const labelText = labelMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
        // 1. Determine Input Metadata
        const isTotalField = ['total_full', 'total_actual', 'net_total', 'days_in_month'].includes(field);
        const readOnlyAttr = isTotalField ? 'readonly tabindex="-1"' : '';
        const bgClass = isTotalField 
            ? 'bg-gray-100 border-gray-200 text-gray-500 font-bold cursor-not-allowed shadow-inner' 
            : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

        let inputHtml = '';

        // 2. Check if the field is "gender" to show a dropdown
        if (field === 'gender') {
            inputHtml = `
                <select id="field-gender" name="gender" required 
                    class="w-full border border-gray-300 p-2.5 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>`;
        } else {
            // 3. Handle standard inputs (text, date, month)
            let inputType = 'text';
            if (field.includes('date')) inputType = 'date';
            if (field === 'month_year') inputType = 'month';

            inputHtml = `
                <input type="${inputType}" id="field-${field}" name="${field}" required ${readOnlyAttr} 
                    class="w-full border p-2.5 rounded shadow-sm outline-none transition ${bgClass}">`;
        }

        // 4. Wrap it all up
        wrapper.innerHTML = `
            <label class="block text-sm font-semibold text-gray-700 mb-1">${labelText}</label>
            ${inputHtml}
        `;
    
        fieldsContainer.appendChild(wrapper);
    });

    if (docData.template_file === 'payslip_sample.docx') {
        attachPayslipCalculator();
    }
}


function attachPayslipCalculator() {
    const fullFields = ['basic_full', 'hra_full', 'conv_full', 'med_full', 'bonus_full', 'spec_full'];
    const actualFields = ['basic_actual', 'hra_actual', 'conv_actual', 'med_actual', 'bonus_actual', 'spec_actual'];

    const monthEl = document.getElementById('field-month_year');
    const daysEl = document.getElementById('field-days_in_month');


    if (monthEl && daysEl) {
        monthEl.addEventListener('input', (e) => {
            const val = e.target.value; 
            if (val) {
                const [year, month] = val.split('-').map(Number);
                const lastDay = new Date(year, month, 0).getDate();
                daysEl.value = lastDay;
            }
        });
    }

    const calculateTotals = () => {
        let totalFull = 0;
        let totalActual = 0;

        fullFields.forEach(field => {
            const val = parseFloat(document.getElementById(`field-${field}`)?.value) || 0;
            totalFull += val;
        });

        actualFields.forEach(field => {
            const val = parseFloat(document.getElementById(`field-${field}`)?.value) || 0;
            totalActual += val;
        });

        const totalFullEl = document.getElementById('field-total_full');
        const totalActualEl = document.getElementById('field-total_actual');
        const netTotalEl = document.getElementById('field-net_total');

        if (totalFullEl) totalFullEl.value = totalFull;
        if (totalActualEl) totalActualEl.value = totalActual;
        
        if (netTotalEl) {
             const net = totalActual > 0 ? totalActual - 200 : 0;
             netTotalEl.value = Math.max(0, net); 
        }
    };

    // 3. Attach listeners to every relevant input
    [...fullFields, ...actualFields].forEach(field => {
        const el = document.getElementById(`field-${field}`);
        if (el) {
            el.addEventListener('input', calculateTotals);
        }
    });
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    

    let colorClass = 'bg-blue-600';
    if (type === 'success') colorClass = 'bg-green-600';
    if (type === 'error') colorClass = 'bg-red-600';

  
    toast.className = `transform transition-all duration-300 translate-x-full opacity-0 ${colorClass} text-white px-6 py-4 rounded shadow-xl flex items-center justify-between text-sm font-medium border border-white/10 min-w-[300px]`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

export function setButtonState(isProcessing) {
    const btn = document.getElementById('submit-btn');
    if (isProcessing) {
        btn.innerText = "Engine Compiling...";
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        btn.disabled = true;
    } else {
        btn.innerText = "Generate Artifact";
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        btn.disabled = false;
    }
}