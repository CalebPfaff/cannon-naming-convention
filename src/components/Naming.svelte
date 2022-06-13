<script>
  const computerTypes = [
    { id: "W", type: "Workstation" },
    { id: "L", type: "Laptop" },
    { id: "T", type: "Tablet" }
  ];
  const squadrons = [
    { id: "SOG", name: "27 SOG" },
    { id: "3OS", name: "3 SOS" },
    { id: "9OS", name: "9 SOS" },
    { id: "12OS", name: "12 SOS" },
    { id: "16OS", name: "16 SOS" },
    { id: "17OS", name: "17 SOS" },
    { id: "20OS", name: "20 SOS" },
    { id: "33OS", name: "33 SOS" },
    { id: "56IS", name: "56 SOIS" },
    { id: "310OS", name: "310 SOS" },
    { id: "318OS", name: "318 SOS" },
    { id: "OSS", name: "27 SOSS" },
    { id: "AMXS", name: "27 SOAMXS" },
    { id: "9AMU", name: "9 AMU" },
    { id: "16AMU", name: "16 AMU" },
    { id: "727MX", name: "727 SOAMXS" },
    { id: "3AMU", name: "3 AMU" },
    { id: "20AMU", name: "20 AMU" },
    { id: "MXG", name: "27 SOMXG" },
    { id: "MUNS", name: "27 SOMS" },
    { id: "SOW", name: "27 SOW" },
    { id: "AOS", name: "27 SOAOS" },
    { id: "CPTS", name: "27 SOCPTS" },
    { id: "MSG", name: "27 SOMSG" },
    { id: "CES", name: "27 SOCES" },
    { id: "CS", name: "27 SOCS" },
    { id: "LRS", name: "27 SOLRS" },
    { id: "CONS", name: "27 SOCONS" },
    { id: "SFS", name: "27 SOSFS" },
    { id: "FSS", name: "27 SOFSS" },
    { id: "STS", name: "26 STS" },
    { id: "43IS", name: "43 IS" },
    { id: "TRS", name: "373 TRS" }
  ];

  let image = 1;
  let selectedType;
  let selectedSQ;
  let serial = "";
  $: name = `CZQZ${selectedType || ""}-${selectedSQ}`;
  $: sdc = serial.substring(serial.length - (15 - name.length), serial.length);
  $: edc = serial.substring(0, Math.min(serial.length, 15 - name.length));
  $: finalName = `${name}${image === 1 ? sdc : edc}`;
</script>

<h1 class="text-center text-2xl font-bold mt-10">
  Cannon AFB Naming Convention
</h1>

<div class="mt-6 card w-96 bg-base-200 shadow-xl mx-auto">
  <div class="card-body">
    <div class="form-control w-full max-w-xs">
      <label class="label" for="computer">
        <div
          class="tooltip tooltip-primary tooltip-right"
          data-tip="What type of computer it is"
        >
          <span class="label-text">Computer type</span>
        </div>
      </label>

      <select bind:value="{selectedType}" class="select select-bordered">
        {#each computerTypes as type}
        <option value="{type.id}">{type.type}</option>
        {/each}
      </select>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label" for="squadron"
        ><div
          class="tooltip tooltip-primary tooltip-right"
          data-tip="Which Squadron the computer is going to"
        >
          <span class="label-text">Squadron</span>
        </div>
      </label>

      <select bind:value="{selectedSQ}" class="select select-bordered">
        {#each squadrons as sq}
        <option value="{sq.id}">{sq.name}</option>
        {/each}
      </select>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label" for="serial">
        <div
          class="tooltip tooltip-primary tooltip-right"
          data-tip="Full serial number of computer"
        >
          <span class="label-text">Serial</span>
        </div>
      </label>
      <input
        bind:value="{serial}"
        type="text"
        placeholder="Type here"
        class="input input-bordered w-full max-w-xs"
      />
    </div>

    <div class="form-control mt-4">
      <span class="label-text">System Image</span>
      <label class="label cursor-pointer">
        <div
          class="tooltip tooltip-primary tooltip-right"
          data-tip="Standard (AFSOC)"
        >
          <span class="label-text">SDC</span>
        </div>
        <input
          type="radio"
          name="radio-6"
          class="radio"
          bind:group="{image}"
          value="{1}"
          checked
        />
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer">
        <div class="tooltip tooltip-primary tooltip-right" data-tip="EITaaS">
          <span class="label-text">EDC</span>
        </div>
        <input
          type="radio"
          name="radio-6"
          class="radio"
          bind:group="{image}"
          value="{2}"
        />
      </label>
    </div>
  </div>
</div>

<div class="mx-auto w-96">
  <div class="mt-10">
    <div class="bg-base-200 rounded-2xl shadow-xl p-5">
      <div class="">Name:</div>
      <div class="text-2xl font-bold mx-auto">{finalName.toUpperCase()}</div>
    </div>
  </div>
</div>
<div class="mx-auto w-max mt-10">
  <label for="my-modal-4" class="btn btn-primary modal-button shadow-lg"
    >View Naming Convention</label
  >
</div>

<!-- Put this part before </body> tag -->
<input type="checkbox" id="my-modal-4" class="modal-toggle" />
<label for="my-modal-4" class="modal cursor-pointer">
  <label class="modal-box relative" for="">
    <h3 class="text-lg font-bold">Cannon AFB Naming Convention</h3>
    <p class="py-4">The name is split up into 4 parts:</p>
    <b>Identifier:</b>
    <p>For Cannon this is CZQZ</p>
    <b>Computer Type:</b>
    <p>W, L, or T for workstation, laptop, or tablet</p>
    <b>Squadron:</b>
    <p>An abbreviated version of the squadron the computer belongs in</p>
    <b>Serial:</b>
    <p>
      The remaining spaces are filled with the beginning or end of the serial,
      for EDC and SDC respectively
    </p>
  </label>
</label>