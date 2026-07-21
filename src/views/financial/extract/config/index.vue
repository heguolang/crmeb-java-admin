<template>
  <div class="divBox">
    <el-card shadow="never" v-loading="loading">
      <div slot="header">提现设置</div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="佣金提现" name="brokerage">
          <el-form ref="brokerageForm" :model="form" :rules="rules" label-width="180px" style="max-width: 720px">
            <el-form-item label="功能开关" prop="brokerageExtractSwitch">
              <el-switch v-model="form.brokerageExtractSwitch" active-value="1" inactive-value="0" />
            </el-form-item>
            <el-form-item label="最低提现金额" prop="brokerageExtractMinPrice">
              <el-input v-model="form.brokerageExtractMinPrice" placeholder="例如 1" style="width: 240px" />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="提现倍数" prop="brokerageExtractMultiple">
              <el-input v-model="form.brokerageExtractMultiple" placeholder="0表示不限制，如 10" style="width: 240px" />
              <span class="unit">元</span>
              <div class="form-tip">填 10 则只能提 10、20、30…；填 100 则只能提 100、200、300…；填 0 不限制</div>
            </el-form-item>
            <el-form-item label="手续费类型" prop="brokerageExtractFeeType">
              <el-radio-group v-model="form.brokerageExtractFeeType">
                <el-radio label="fixed">固定金额</el-radio>
                <el-radio label="percent">比例</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="手续费" prop="brokerageExtractFee">
              <el-input v-model="form.brokerageExtractFee" placeholder="固定填元，比例填百分比数字" style="width: 240px" />
              <span class="unit">{{ form.brokerageExtractFeeType === 'percent' ? '%' : '元' }}</span>
            </el-form-item>
            <el-alert
              type="info"
              :closable="false"
              title="实到金额 = 提现金额 − 手续费；比例模式按提现金额百分比计算，保留两位小数。"
              style="margin-bottom: 16px"
            />
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="余额提现" name="balance">
          <el-form ref="balanceForm" :model="form" :rules="rules" label-width="180px" style="max-width: 720px">
            <el-form-item label="功能开关" prop="balanceExtractSwitch">
              <el-switch v-model="form.balanceExtractSwitch" active-value="1" inactive-value="0" />
            </el-form-item>
            <el-form-item label="最低提现金额" prop="balanceExtractMinPrice">
              <el-input v-model="form.balanceExtractMinPrice" placeholder="例如 1" style="width: 240px" />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="提现倍数" prop="balanceExtractMultiple">
              <el-input v-model="form.balanceExtractMultiple" placeholder="0表示不限制，如 100" style="width: 240px" />
              <span class="unit">元</span>
              <div class="form-tip">填 10 则只能提 10、20、30…；填 100 则只能提 100、200、300…；填 0 不限制</div>
            </el-form-item>
            <el-form-item label="手续费类型" prop="balanceExtractFeeType">
              <el-radio-group v-model="form.balanceExtractFeeType">
                <el-radio label="fixed">固定金额</el-radio>
                <el-radio label="percent">比例</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="手续费" prop="balanceExtractFee">
              <el-input v-model="form.balanceExtractFee" placeholder="固定填元，比例填百分比数字" style="width: 240px" />
              <span class="unit">{{ form.balanceExtractFeeType === 'percent' ? '%' : '元' }}</span>
            </el-form-item>
            <el-alert
              type="warning"
              :closable="false"
              title="余额提现默认关闭，开启后用户可从余额申请提现；审核在「申请提现」中处理。"
              style="margin-bottom: 16px"
            />
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="公共设置" name="common">
          <el-form label-width="180px" style="max-width: 720px">
            <el-form-item label="提现支持账户" required>
              <div class="extract-type-row">
                <el-checkbox v-model="extractTypeMap.bank">银行卡</el-checkbox>
                <el-checkbox v-model="extractTypeMap.weixin">微信</el-checkbox>
                <el-checkbox v-model="extractTypeMap.alipay">支付宝</el-checkbox>
              </div>
              <div class="form-tip">勾选后前端才展示对应提现方式，至少勾选一种</div>
            </el-form-item>
            <el-form-item label="提现银行卡">
              <el-input
                type="textarea"
                :rows="6"
                v-model="form.userExtractBank"
                placeholder="每个银行换行，佣金/余额提现共用"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div style="padding-left: 180px; margin-top: 8px">
        <el-button type="primary" :loading="saving" @click="onSave" v-hasPermi="['admin:finance:extract:config']">保存</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { extractConfigGetApi, extractConfigSaveApi } from '@/api/financial';

const nonNegNumber = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback(new Error('请输入数值'));
    return;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    callback(new Error('必须是大于等于0的数字'));
    return;
  }
  callback();
};

export default {
  name: 'ExtractConfig',
  data() {
    return {
      loading: false,
      saving: false,
      activeTab: 'brokerage',
      form: {
        brokerageExtractSwitch: '1',
        brokerageExtractMinPrice: '0',
        brokerageExtractFeeType: 'fixed',
        brokerageExtractFee: '0',
        brokerageExtractMultiple: '0',
        balanceExtractSwitch: '0',
        balanceExtractMinPrice: '1',
        balanceExtractFeeType: 'fixed',
        balanceExtractFee: '0',
        balanceExtractMultiple: '0',
        userExtractBank: '',
        userExtractType: 'bank,weixin,alipay',
      },
      extractTypeMap: {
        bank: true,
        weixin: true,
        alipay: true,
      },
      rules: {
        brokerageExtractMinPrice: [{ validator: nonNegNumber, trigger: 'blur' }],
        brokerageExtractFee: [{ validator: nonNegNumber, trigger: 'blur' }],
        brokerageExtractMultiple: [{ validator: nonNegNumber, trigger: 'blur' }],
        balanceExtractMinPrice: [{ validator: nonNegNumber, trigger: 'blur' }],
        balanceExtractFee: [{ validator: nonNegNumber, trigger: 'blur' }],
        balanceExtractMultiple: [{ validator: nonNegNumber, trigger: 'blur' }],
      },
    };
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      this.loading = true;
      extractConfigGetApi()
        .then((res) => {
          this.form = Object.assign({}, this.form, res || {});
          const types = String(this.form.userExtractType || 'bank,weixin,alipay')
            .split(',')
            .map((s) => (s || '').trim())
            .filter((s) => ['bank', 'weixin', 'alipay'].includes(s));
          const enabled = types.length ? types : ['bank', 'weixin', 'alipay'];
          this.extractTypeMap = {
            bank: enabled.includes('bank'),
            weixin: enabled.includes('weixin'),
            alipay: enabled.includes('alipay'),
          };
        })
        .finally(() => {
          this.loading = false;
        });
    },
    getSelectedExtractTypes() {
      const list = [];
      if (this.extractTypeMap.bank) list.push('bank');
      if (this.extractTypeMap.weixin) list.push('weixin');
      if (this.extractTypeMap.alipay) list.push('alipay');
      return list;
    },
    onSave() {
      const selected = this.getSelectedExtractTypes();
      if (!selected.length) {
        this.activeTab = 'common';
        this.$message.warning('请至少勾选一种提现支持账户');
        return;
      }
      this.form.userExtractType = selected.join(',');
      const forms = ['brokerageForm', 'balanceForm'];
      const run = (idx) => {
        if (idx >= forms.length) {
          this.doSave();
          return;
        }
        const ref = this.$refs[forms[idx]];
        if (!ref) {
          run(idx + 1);
          return;
        }
        ref.validate((valid) => {
          if (!valid) {
            this.activeTab = idx === 0 ? 'brokerage' : 'balance';
            return;
          }
          run(idx + 1);
        });
      };
      run(0);
    },
    doSave() {
      this.saving = true;
      extractConfigSaveApi(this.form)
        .then(() => {
          this.$message.success('保存成功');
          this.loadConfig();
        })
        .finally(() => {
          this.saving = false;
        });
    },
  },
};
</script>

<style scoped>
.unit {
  margin-left: 8px;
  color: #909399;
}
.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.extract-type-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 32px;
}
.extract-type-row >>> .el-checkbox {
  margin-right: 24px;
  display: inline-flex;
  align-items: center;
}
</style>
