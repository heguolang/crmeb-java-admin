<template>
  <div class="divBox">
    <el-card shadow="never">
      <div slot="header">消费券 / 权证配置</div>
      <el-form ref="form" :model="form" :rules="rules" label-width="220px" v-loading="loading" style="max-width: 720px">
        <el-form-item label="功能开关">
          <el-switch v-model="form.voucherWarrantSwitch" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="多少积分 = 1 消费券" prop="integralToVoucherRatio">
          <el-input v-model="form.integralToVoucherRatio" placeholder="例如 100" />
        </el-form-item>
        <el-form-item label="每日强制释放积分百分比(%)" prop="integralDailyReleaseRatio">
          <el-input v-model="form.integralDailyReleaseRatio" placeholder="例如 10，范围 0~100" />
        </el-form-item>
        <el-form-item label="多少消费券 = 1 元余额" prop="voucherToBalanceRatio">
          <el-input v-model="form.voucherToBalanceRatio" placeholder="例如 10" />
        </el-form-item>
        <el-form-item label="多少消费券 = 1 权证" prop="warrantNeedVoucher">
          <el-input v-model="form.warrantNeedVoucher" placeholder="例如 5，仅用消费券兑换" />
        </el-form-item>
        <el-form-item label="多少积分 = 1 权证" prop="warrantNeedIntegral">
          <el-input v-model="form.warrantNeedIntegral" placeholder="例如 100，仅用积分兑换" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { voucherWarrantConfigGetApi, voucherWarrantConfigSaveApi } from '@/api/marketing';

const positiveNumber = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入数值'));
    return;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    callback(new Error('必须是大于0的数字'));
    return;
  }
  callback();
};

const percentNumber = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入百分比'));
    return;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0 || num > 100) {
    callback(new Error('需在0到100之间（不含0）'));
    return;
  }
  callback();
};

export default {
  name: 'VoucherWarrantConfig',
  data() {
    return {
      loading: false,
      saving: false,
      form: {
        voucherWarrantSwitch: '1',
        integralToVoucherRatio: '100',
        integralDailyReleaseRatio: '10',
        voucherToBalanceRatio: '10',
        warrantNeedVoucher: '5',
        warrantNeedIntegral: '100',
      },
      rules: {
        integralToVoucherRatio: [{ validator: positiveNumber, trigger: 'blur' }],
        integralDailyReleaseRatio: [{ validator: percentNumber, trigger: 'blur' }],
        voucherToBalanceRatio: [{ validator: positiveNumber, trigger: 'blur' }],
        warrantNeedVoucher: [{ validator: positiveNumber, trigger: 'blur' }],
        warrantNeedIntegral: [{ validator: positiveNumber, trigger: 'blur' }],
      },
    };
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      this.loading = true;
      voucherWarrantConfigGetApi()
        .then((res) => {
          this.form = Object.assign({}, this.form, res || {});
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onSave() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        voucherWarrantConfigSaveApi(this.form)
          .then(() => {
            this.$message.success('保存成功');
            this.loadConfig();
          })
          .finally(() => {
            this.saving = false;
          });
      });
    },
  },
};
</script>
